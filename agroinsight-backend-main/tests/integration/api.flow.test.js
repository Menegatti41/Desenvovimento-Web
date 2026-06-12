import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { sequelize } from '../../src/config/sequelize.js';
import { setFetchImpl } from '../../src/services/climate.service.js';
import { setFetchImpl as setLlmFetch } from '../../src/services/llm.service.js';

const app = createApp();

// Stub determinístico da Open-Meteo (evita rede nos testes).
function stubClimate() {
  setFetchImpl(async (url) => {
    const isArchive = String(url).includes('archive');
    const body = isArchive
      ? {
          daily: {
            time: ['2026-01-01', '2026-01-02'],
            temperature_2m_max: [30, 30],
            temperature_2m_min: [20, 20],
            precipitation_sum: [5, 5],
          },
        }
      : {
          current: { time: '2026-01-01T12:00', temperature_2m: 28, relative_humidity_2m: 60, precipitation: 0 },
          daily: {
            time: ['2026-01-01'],
            temperature_2m_max: [38], // dispara alerta de calor
            temperature_2m_min: [24],
            precipitation_sum: [0],
          },
        };
    return { ok: true, status: 200, json: async () => body };
  });
}

beforeAll(async () => {
  stubClimate();
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

async function registerAndLogin(email) {
  await request(app).post('/auth/register')
    .send({ name: 'Produtor', email, password: '123456', role: 'produtor' });
  const res = await request(app).post('/auth/login').send({ email, password: '123456' });
  return res.body.accessToken;
}

describe('AgroInsight API - fluxo completo', () => {
  it('healthcheck responde ok', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('bloqueia rota protegida sem token (401)', async () => {
    const res = await request(app).get('/talhoes');
    expect(res.status).toBe(401);
  });

  it('register não expõe passwordHash', async () => {
    const res = await request(app).post('/auth/register')
      .send({ name: 'Ana', email: 'ana@fazenda.com', password: '123456' });
    expect(res.status).toBe(201);
    expect(res.body.passwordHash).toBeUndefined();
    expect(res.body.role).toBe('produtor');
  });

  it('rejeita e-mail duplicado (409)', async () => {
    const res = await request(app).post('/auth/register')
      .send({ name: 'Ana 2', email: 'ana@fazenda.com', password: '123456' });
    expect(res.status).toBe(409);
  });

  it('fluxo CRUD de talhão e safra + insights', async () => {
    const token = await registerAndLogin('joao@fazenda.com');
    const auth = { Authorization: `Bearer ${token}` };

    // cria talhão
    const talhaoRes = await request(app).post('/talhoes').set(auth)
      .send({ nome: 'Talhão Teste', latitude: -12.5, longitude: -55.7, areaHectares: 100 });
    expect(talhaoRes.status).toBe(201);
    const talhaoId = talhaoRes.body.id;

    // cria safra
    const safraRes = await request(app).post(`/talhoes/${talhaoId}/safras`).set(auth)
      .send({ cultura: 'Soja', variedade: 'BRS', dataSemeadura: '2025-10-15', produtividadeEstimada: 62 });
    expect(safraRes.status).toBe(201);
    const safraId = safraRes.body.id;

    // calendário agrícola (sem rede)
    const calRes = await request(app).get(`/safras/${safraId}/calendario`).set(auth);
    expect(calRes.status).toBe(200);
    expect(calRes.body.cicloDias).toBe(120);

    // performance indisponível (sem colheita)
    const perf1 = await request(app).get(`/safras/${safraId}/performance`).set(auth);
    expect(perf1.body.performance.disponivel).toBe(false);

    // registra colheita e recalcula performance
    await request(app).put(`/safras/${safraId}`).set(auth)
      .send({ produtividadeReal: 58.4, status: 'colhida', dataColheitaReal: '2026-02-12' });
    const perf2 = await request(app).get(`/safras/${safraId}/performance`).set(auth);
    expect(perf2.body.performance.disponivel).toBe(true);
    expect(perf2.body.performance.avaliacao).toBe('abaixo_do_esperado');

    // insight climático (fetch stubado)
    const clima = await request(app).get(`/talhoes/${talhaoId}/clima`).set(auth);
    expect(clima.status).toBe(200);
    expect(clima.body.atual.temperaturaC).toBe(28);

    // alertas (stub dispara calor excessivo)
    const alertas = await request(app).get(`/safras/${safraId}/alertas`).set(auth);
    expect(alertas.status).toBe(200);
    expect(alertas.body.alertas.map((a) => a.tipo)).toContain('calor_excessivo');
  });

  it('mapa da produção retorna marcadores + GeoJSON', async () => {
    const token = await registerAndLogin('mapa@fazenda.com');
    const auth = { Authorization: `Bearer ${token}` };

    const talhaoRes = await request(app).post('/talhoes').set(auth)
      .send({ nome: 'Talhão Mapa', latitude: -12.5, longitude: -55.7, areaHectares: 50 });
    const talhaoId = talhaoRes.body.id;
    await request(app).post(`/talhoes/${talhaoId}/safras`).set(auth)
      .send({ cultura: 'Soja', dataSemeadura: '2025-10-15' });

    const res = await request(app).get('/insights/mapa').set(auth);
    expect(res.status).toBe(200);
    expect(res.body.geojson.type).toBe('FeatureCollection');
    const feature = res.body.geojson.features.find((f) => f.properties.talhaoId === talhaoId);
    expect(feature.geometry.coordinates).toEqual([-55.7, -12.5]);
    // stub do clima dispara calor (tmax 38) -> marcador crítico (vermelho)
    expect(feature.properties.nivel).toBe('critico');
    expect(feature.properties.cor).toBe('#e23b3b');
  });

  it('recomendação usa a LLM (Gemini stubada) e retorna ações', async () => {
    process.env.GEMINI_API_KEY = 'fake-key';
    setLlmFetch(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: JSON.stringify({
          resumo: 'Atenção ao calor previsto.',
          nivelRisco: 'alto',
          acoes: [{ titulo: 'Irrigar ao amanhecer', descricao: 'Reduz estresse térmico', prioridade: 'alta', prazo: '48h' }],
        }) }] } }],
      }),
    }));

    const token = await registerAndLogin('llm@fazenda.com');
    const auth = { Authorization: `Bearer ${token}` };
    const talhaoRes = await request(app).post('/talhoes').set(auth)
      .send({ nome: 'Talhão LLM', latitude: -12.5, longitude: -55.7, areaHectares: 80 });
    const safraRes = await request(app).post(`/talhoes/${talhaoRes.body.id}/safras`).set(auth)
      .send({ cultura: 'Soja', dataSemeadura: '2025-10-15' });

    const res = await request(app).get(`/safras/${safraRes.body.id}/recomendacao`).set(auth);
    expect(res.status).toBe(200);
    expect(res.body.recomendacao.fonte).toBe('gemini');
    expect(res.body.recomendacao.acoes[0].titulo).toBe('Irrigar ao amanhecer');
    expect(res.body.marcador.cor).toBe('#e23b3b');
    delete process.env.GEMINI_API_KEY;
  });

  it('recomendação cai no fallback por regras sem GEMINI_API_KEY', async () => {
    delete process.env.GEMINI_API_KEY;
    const token = await registerAndLogin('fallback@fazenda.com');
    const auth = { Authorization: `Bearer ${token}` };
    const talhaoRes = await request(app).post('/talhoes').set(auth)
      .send({ nome: 'Talhão Fallback', latitude: -12.5, longitude: -55.7, areaHectares: 30 });
    const safraRes = await request(app).post(`/talhoes/${talhaoRes.body.id}/safras`).set(auth)
      .send({ cultura: 'Soja', dataSemeadura: '2025-10-15' });

    const res = await request(app).get(`/safras/${safraRes.body.id}/recomendacao`).set(auth);
    expect(res.status).toBe(200);
    expect(res.body.recomendacao.fonte).toBe('regras');
    expect(Array.isArray(res.body.recomendacao.acoes)).toBe(true);
  });

  it('produtor não acessa talhão de outro produtor (403)', async () => {
    const tokenA = await registerAndLogin('produtorA@fazenda.com');
    const tokenB = await registerAndLogin('produtorB@fazenda.com');

    const talhaoRes = await request(app).post('/talhoes')
      .set({ Authorization: `Bearer ${tokenA}` })
      .send({ nome: 'Privado', latitude: -10, longitude: -50, areaHectares: 10 });
    const talhaoId = talhaoRes.body.id;

    const res = await request(app).get(`/talhoes/${talhaoId}`)
      .set({ Authorization: `Bearer ${tokenB}` });
    expect(res.status).toBe(403);
  });
});
