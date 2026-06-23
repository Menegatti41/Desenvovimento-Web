import { Safra, Talhao } from '../models/index.js';
import { asyncHandler } from '../middlewares/errorMiddleware.js';
import { getCurrentAndForecast, getDailyHistory } from '../services/climate.service.js';
import { buildPhenology } from '../services/phenology.service.js';
import { evaluateRisks } from '../services/alerts.service.js';
import { buildAgendaAgricola } from '../services/calendar.service.js';
import {
  buildMarker,
  markerToGeoJSONFeature,
  buildContext,
  fallbackAdvisory,
} from '../services/advisory.service.js';
import { generateAdvisory, isConfigured } from '../services/llm.service.js';

function parseId(value) {
  return Number.parseInt(value, 10);
}

function isOwnerOrAdmin(userId, authUser) {
  return authUser.role === 'admin' || userId === authUser.id;
}

async function loadTalhaoOrDeny(req, res) {
  const talhao = await Talhao.findByPk(parseId(req.params.id));
  if (!talhao) {
    res.status(404).json({ message: 'Talhão não encontrado' });
    return null;
  }
  if (!isOwnerOrAdmin(talhao.userId, req.authUser)) {
    res.status(403).json({ message: 'Acesso negado a este talhão' });
    return null;
  }
  return talhao;
}

async function loadSafraOrDeny(req, res) {
  const safra = await Safra.findByPk(parseId(req.params.id), {
    include: [{ model: Talhao, as: 'talhao' }],
  });
  if (!safra) {
    res.status(404).json({ message: 'Safra não encontrada' });
    return null;
  }
  if (!isOwnerOrAdmin(safra.talhao?.userId, req.authUser)) {
    res.status(403).json({ message: 'Acesso negado a esta safra' });
    return null;
  }
  return safra;
}

// Erros da API climática externa viram 502 (Bad Gateway), não 500.
async function withClimate(res, fn) {
  try {
    return await fn();
  } catch (err) {
    res.status(502).json({ message: 'Falha ao consultar a API climática', detalhe: err.message });
    return null;
  }
}

// GET /talhoes/:id/clima — monitoramento climático em tempo real.
export const getClimaByTalhao = asyncHandler(async (req, res) => {
  const talhao = await loadTalhaoOrDeny(req, res);
  if (!talhao) return;

  const dias = Number.parseInt(req.query.dias, 10) || 7;
  const clima = await withClimate(res, () =>
    getCurrentAndForecast(talhao.latitude, talhao.longitude, dias));
  if (!clima) return;

  // TRADUTOR DE CLIMA: Entrega exatamente as variáveis que o VisaoGeral.tsx lê
  return res.json({
    temperatura: clima.atual.temperaturaC || 0,
    umidade: clima.atual.umidadeRelativa || 0, // Usando a umidade do ar (%)
    precipitacao: clima.atual.precipitacaoMm || 0,
    localizacao: talhao.nome
  });
});

// GET /safras/:id/fenologia — ciclo fenológico via graus-dia desde a semeadura.
export const getFenologiaBySafra = asyncHandler(async (req, res) => {
  const safra = await loadSafraOrDeny(req, res);
  if (!safra) return;

  const { latitude, longitude } = safra.talhao;
  const historico = await withClimate(res, () =>
    getDailyHistory(latitude, longitude, safra.dataSemeadura));
  if (!historico) return;

  const fenologia = buildPhenology(safra.cultura, historico);
  if (!fenologia) {
    return res.status(422).json({ message: `Cultura "${safra.cultura}" sem parâmetros agronômicos` });
  }

  // 1. TRADUTOR DA FENOLOGIA: Adapta os nomes para o Insights.tsx
  let descricao = 'Monitoramento ativo do ciclo biológico.';
  if (fenologia.estagio === 'Vegetativo') descricao = 'Desenvolvimento foliar ativo. Fase crítica para formação da estrutura da planta.';
  if (fenologia.estagio === 'Reprodutivo') descricao = 'Fase de florescimento e enchimento de grãos. Alta demanda hídrica.';
  if (fenologia.estagio === 'Maturação/Colheita') descricao = 'Preparação para colheita. Redução natural de umidade.';

  const formatoFrontend = {
    grausDiaAcumulados: fenologia.gddAcumulado,
    estagioAtual: fenologia.estagio,
    descricaoEstagio: descricao,
    progressoEstagio: fenologia.progressoCiclo
  };

  // Envia exatamente o objeto que o React espera
  return res.json(formatoFrontend);
});


// GET /safras/:id/alertas — janelas críticas de geada, calor e estresse hídrico.
export const getAlertasBySafra = asyncHandler(async (req, res) => {
  const safra = await loadSafraOrDeny(req, res);
  if (!safra) return;

  const { latitude, longitude } = safra.talhao;
  const dias = Number.parseInt(req.query.dias, 10) || 7;
  const clima = await withClimate(res, () =>
    getCurrentAndForecast(latitude, longitude, dias));
  if (!clima) return;

  const risco = evaluateRisks(clima.previsao, safra.cultura);
  if (!risco) {
    return res.status(422).json({ message: `Cultura "${safra.cultura}" sem parâmetros agronômicos` });
  }

  // TRADUTOR DE ALERTAS: Mapeia para o formato que o Insights.tsx espera
  const alertasFormatados = (risco.alertas || []).map((alerta, index) => {
    let tipoGravidade = 'informativo';
    if (alerta.nivel === 'alto') tipoGravidade = 'critico';
    if (alerta.nivel === 'medio') tipoGravidade = 'atencao';

    return {
      id: `${safra.id}-alerta-${index}`,
      tipo: tipoGravidade, // O Front-end vai ler isso e pintar de vermelho ou amarelo!
      mensagem: alerta.mensagem,
      data: 'Próximos dias',
      categoriaOriginal: alerta.tipo 
    };
  });

  return res.json(alertasFormatados);
});

// GET /safras/:id/calendario — calendário agrícola sugerido (não depende de clima).
export const getCalendarioBySafra = asyncHandler(async (req, res) => {
  const safra = await loadSafraOrDeny(req, res);
  if (!safra) return;

  const agenda = buildAgendaAgricola(safra.cultura, safra.dataSemeadura);
  if (!agenda) {
    return res.status(422).json({ message: `Cultura "${safra.cultura}" sem parâmetros agronômicos` });
  }

  res.json({ safraId: safra.id, ...agenda });
});

// Safra "relevante" de um talhão para o painel: a mais recente ainda não colhida;
// se todas estiverem colhidas, a mais recente.
function pickRelevantSafra(safras) {
  if (!safras.length) return null;
  const ordenadas = [...safras].sort((a, b) => String(b.dataSemeadura).localeCompare(String(a.dataSemeadura)));
  return ordenadas.find((s) => s.status !== 'colhida') ?? ordenadas[0];
}

// GET /insights/mapa — feed do MAPA DA PRODUÇÃO.
// Para cada talhão do usuário devolve um marcador geolocalizado (cor por risco,
// raio = área) + um resumo. Também devolve um FeatureCollection GeoJSON pronto
// para o front desenhar os círculos coloridos.
export const getMapaInsights = asyncHandler(async (req, res) => {
  const where = req.authUser.role === 'admin' ? {} : { userId: req.authUser.id };
  const talhoes = await Talhao.findAll({
    where,
    include: [{ model: Safra, as: 'safras' }],
    order: [['id', 'ASC']],
  });

  const marcadores = await Promise.all(
    talhoes.map(async (talhao) => {
      const safra = pickRelevantSafra(talhao.safras ?? []);

      // Sem safra ativa: marcador cinza, sem chamada climática.
      if (!safra) {
        return buildMarker({
          talhaoId: talhao.id,
          nome: talhao.nome,
          latitude: talhao.latitude,
          longitude: talhao.longitude,
          areaHectares: talhao.areaHectares,
          semSafra: true,
        });
      }

      // Com safra: avalia riscos a partir da previsão. Falha de clima não derruba
      // o mapa inteiro — o talhão entra como "ok" com aviso.
      let alertas = [];
      try {
        const clima = await getCurrentAndForecast(talhao.latitude, talhao.longitude);
        alertas = evaluateRisks(clima.previsao, safra.cultura)?.alertas ?? [];
      } catch {
        alertas = [];
      }

      return buildMarker({
        talhaoId: talhao.id,
        safraId: safra.id,
        nome: talhao.nome,
        latitude: talhao.latitude,
        longitude: talhao.longitude,
        areaHectares: talhao.areaHectares,
        alertas,
      });
    }),
  );

  res.json({
    total: marcadores.length,
    marcadores,
    geojson: {
      type: 'FeatureCollection',
      features: marcadores.map(markerToGeoJSONFeature),
    },
  });
});

// GET /safras/:id/recomendacao — INTELIGÊNCIA via LLM (Gemini).
// Junta clima + fenologia + alertas e pede orientações ao Gemini. Se a chave
// não estiver configurada (ou a chamada falhar), cai no fallback por regras.
export const getRecomendacaoBySafra = asyncHandler(async (req, res) => {
  const safra = await loadSafraOrDeny(req, res);
  if (!safra) return;

  const talhao = safra.talhao;
  const { latitude, longitude } = talhao;

  const clima = await withClimate(res, () => getCurrentAndForecast(latitude, longitude));
  if (!clima) return;

  let fenologia = null;
  try {
    const historico = await getDailyHistory(latitude, longitude, safra.dataSemeadura);
    fenologia = buildPhenology(safra.cultura, historico);
  } catch {
    fenologia = null;
  }

  const alertas = evaluateRisks(clima.previsao, safra.cultura)?.alertas ?? [];
  const context = buildContext({ talhao, safra, fenologia, clima, alertas });

  let recomendacao;
  try {
    recomendacao = isConfigured()
      ? await generateAdvisory(context)
      : fallbackAdvisory(context);
  } catch (err) {
    recomendacao = { ...fallbackAdvisory(context), aviso: `LLM indisponível (${err.message}), usando regras.` };
  }

  // 3. TRADUTOR DE RECOMENDAÇÃO: Envia apenas o objeto da recomendação, removendo o "empacotamento" (safraId, contexto, etc)
  return res.json(recomendacao);
});
