import { describe, expect, it } from 'vitest';
import {
  classifyRisk,
  radiusMeters,
  summarizeForecast,
  buildMarker,
  markerToGeoJSONFeature,
  fallbackAdvisory,
  RISK_COLORS,
} from '../../src/services/advisory.service.js';

describe('advisory.classifyRisk', () => {
  it('crítico quando há alerta de nível alto', () => {
    expect(classifyRisk([{ nivel: 'medio' }, { nivel: 'alto' }])).toBe('critico');
  });
  it('atenção quando o pior alerta é médio', () => {
    expect(classifyRisk([{ nivel: 'medio' }])).toBe('atencao');
  });
  it('ok quando não há alertas', () => {
    expect(classifyRisk([])).toBe('ok');
  });
});

describe('advisory.radiusMeters', () => {
  it('converte área (ha) no raio do círculo equivalente', () => {
    // 100 ha = 1.000.000 m² -> raio = sqrt(1e6/π) ≈ 564
    expect(radiusMeters(100)).toBe(564);
  });
  it('retorna 0 para área inválida', () => {
    expect(radiusMeters(0)).toBe(0);
    expect(radiusMeters(undefined)).toBe(0);
  });
});

describe('advisory.summarizeForecast', () => {
  it('agrega máximas, mínimas e chuva', () => {
    const r = summarizeForecast([
      { tmax: 30, tmin: 18, precipitacaoMm: 2 },
      { tmax: 34, tmin: 15, precipitacaoMm: 1.5 },
    ]);
    expect(r).toEqual({ dias: 2, tempMaxC: 34, tempMinC: 15, chuvaTotalMm: 3.5 });
  });
  it('retorna null para previsão vazia', () => {
    expect(summarizeForecast([])).toBeNull();
  });
});

describe('advisory.buildMarker', () => {
  const base = { talhaoId: 1, safraId: 9, nome: 'Norte', latitude: -12.5, longitude: -55.7, areaHectares: 100 };

  it('marcador crítico fica vermelho', () => {
    const m = buildMarker({ ...base, alertas: [{ nivel: 'alto', mensagem: 'Geada!' }] });
    expect(m.nivel).toBe('critico');
    expect(m.cor).toBe(RISK_COLORS.critico);
    expect(m.raioMetros).toBe(564);
    expect(m.totalAlertas).toBe(1);
  });

  it('marcador sem safra fica cinza', () => {
    const m = buildMarker({ ...base, safraId: undefined, semSafra: true });
    expect(m.nivel).toBe('sem_safra');
    expect(m.cor).toBe(RISK_COLORS.sem_safra);
  });

  it('vira Feature GeoJSON com coordenadas [lng, lat]', () => {
    const m = buildMarker({ ...base, alertas: [] });
    const f = markerToGeoJSONFeature(m);
    expect(f.type).toBe('Feature');
    expect(f.geometry.coordinates).toEqual([-55.7, -12.5]);
    expect(f.properties.cor).toBe(RISK_COLORS.ok);
  });
});

describe('advisory.fallbackAdvisory', () => {
  it('gera ação de alta prioridade para geada', () => {
    const ctx = { safra: { cultura: 'Soja' }, alertas: [{ tipo: 'geada', nivel: 'alto', mensagem: 'x' }] };
    const r = fallbackAdvisory(ctx);
    expect(r.fonte).toBe('regras');
    expect(r.nivelRisco).toBe('alto');
    expect(r.acoes.some((a) => a.prioridade === 'alta')).toBe(true);
  });

  it('gera ação de rotina quando não há alertas', () => {
    const ctx = { safra: { cultura: 'Milho' }, fenologia: { estagio: 'Vegetativo' }, alertas: [] };
    const r = fallbackAdvisory(ctx);
    expect(r.nivelRisco).toBe('baixo');
    expect(r.acoes).toHaveLength(1);
  });
});
