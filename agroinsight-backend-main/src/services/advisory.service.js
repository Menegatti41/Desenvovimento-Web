// Serviço de inteligência agronômica (camada PURA, sem I/O).
//
// Responsável por:
//  - classificar o nível de risco de um talhão/safra a partir dos alertas;
//  - montar o "marcador" geolocalizado consumido pelo mapa da produção
//    (coordenada + cor + raio do círculo + resumo);
//  - montar o contexto e o prompt enviados à LLM;
//  - gerar uma recomendação de FALLBACK por regras (quando a LLM não está disponível).

// Paleta de cores dos marcadores no mapa.
export const RISK_COLORS = {
  critico: '#e23b3b', // vermelho
  atencao: '#f5a623', // amarelo
  ok: '#2ecc71', // verde
  sem_safra: '#9aa0a6', // cinza
};

/**
 * Classifica o nível de risco a partir da lista de alertas.
 * @returns {'critico'|'atencao'|'ok'}
 */
export function classifyRisk(alertas = []) {
  const niveis = alertas.map((a) => a.nivel);
  if (niveis.includes('alto')) return 'critico';
  if (niveis.includes('medio')) return 'atencao';
  return 'ok';
}

// Mapeia o nível interno do marcador para o vocabulário de risco da LLM.
function nivelMarcadorParaRisco(nivel) {
  if (nivel === 'critico') return 'alto';
  if (nivel === 'atencao') return 'medio';
  return 'baixo';
}

/**
 * Raio do círculo (em metros) equivalente à área do talhão.
 * areaHectares -> m² -> raio de um círculo de mesma área.
 */
export function radiusMeters(areaHectares) {
  const areaM2 = (Number(areaHectares) || 0) * 10000;
  if (areaM2 <= 0) return 0;
  return Math.round(Math.sqrt(areaM2 / Math.PI));
}

/** Resumo agregado da previsão (para contexto e marcador). */
export function summarizeForecast(previsao = []) {
  const dias = Array.isArray(previsao) ? previsao.filter((d) => Number.isFinite(d?.tmax)) : [];
  if (dias.length === 0) return null;
  return {
    dias: dias.length,
    tempMaxC: Math.max(...dias.map((d) => d.tmax)),
    tempMinC: Math.min(...dias.map((d) => d.tmin)),
    chuvaTotalMm: Number(dias.reduce((a, d) => a + (Number(d.precipitacaoMm) || 0), 0).toFixed(1)),
  };
}

function resumoAlertas(alertas = [], nivel) {
  if (!alertas.length) return 'Sem riscos relevantes na janela atual.';
  if (nivel === 'sem_safra') return 'Nenhuma safra ativa neste talhão.';
  return alertas.map((a) => a.mensagem).join(' ');
}

/**
 * Monta o marcador geolocalizado do mapa da produção.
 * @param {object} p { talhaoId, safraId, nome, latitude, longitude, areaHectares, alertas, semSafra }
 */
export function buildMarker(p) {
  const alertas = p.alertas ?? [];
  const nivel = p.semSafra ? 'sem_safra' : classifyRisk(alertas);
  return {
    talhaoId: p.talhaoId,
    safraId: p.safraId ?? null,
    nome: p.nome,
    latitude: p.latitude,
    longitude: p.longitude,
    raioMetros: radiusMeters(p.areaHectares),
    nivel,
    cor: RISK_COLORS[nivel],
    totalAlertas: alertas.length,
    resumo: resumoAlertas(alertas, nivel),
  };
}

/** Converte um marcador em uma Feature GeoJSON (Point) para o mapa. */
export function markerToGeoJSONFeature(marker) {
  return {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [marker.longitude, marker.latitude] },
    properties: {
      talhaoId: marker.talhaoId,
      safraId: marker.safraId,
      nome: marker.nome,
      nivel: marker.nivel,
      cor: marker.cor,
      raioMetros: marker.raioMetros,
      totalAlertas: marker.totalAlertas,
      resumo: marker.resumo,
    },
  };
}

/**
 * Estrutura o contexto agronômico usado pela LLM e pelas regras de fallback.
 */
export function buildContext({ talhao, safra, fenologia, clima, alertas }) {
  return {
    talhao: {
      nome: talhao.nome,
      latitude: talhao.latitude,
      longitude: talhao.longitude,
      areaHectares: talhao.areaHectares,
    },
    safra: {
      cultura: safra.cultura,
      variedade: safra.variedade ?? null,
      dataSemeadura: safra.dataSemeadura,
      status: safra.status,
      produtividadeEstimada: safra.produtividadeEstimada ?? null,
    },
    fenologia: fenologia
      ? {
          estagio: fenologia.estagio,
          gddAcumulado: fenologia.gddAcumulado,
          progressoCiclo: fenologia.progressoCiclo,
        }
      : null,
    clima: {
      atual: clima?.atual ?? null,
      previsaoResumo: summarizeForecast(clima?.previsao),
    },
    alertas: (alertas ?? []).map((a) => ({ tipo: a.tipo, nivel: a.nivel, mensagem: a.mensagem })),
  };
}

/**
 * Monta o prompt em PT-BR para a LLM agir como engenheiro agrônomo.
 */
export function buildPrompt(context) {
  return [
    'Você é um engenheiro agrônomo assistente da plataforma AgroInsight.',
    'Com base nos dados geoespaciais e climáticos do talhão abaixo, oriente o produtor rural',
    'sobre o que deve ser feito AGORA. Seja objetivo, prático e específico para a cultura e o',
    'estágio fenológico informados. Responda em português do Brasil.',
    '',
    'Dados (JSON):',
    JSON.stringify(context, null, 2),
    '',
    'Responda SOMENTE no formato JSON solicitado: um resumo curto, o nível de risco geral',
    '(baixo, medio, alto) e uma lista de ações recomendadas com título, descrição, prioridade',
    '(alta, media, baixa) e prazo sugerido.',
  ].join('\n');
}

/**
 * Recomendação determinística baseada em regras — usada quando a LLM não está
 * configurada/disponível. Mantém o mesmo formato de saída da LLM.
 */
export function fallbackAdvisory(context) {
  const alertas = context.alertas ?? [];
  const nivelMarcador = classifyRisk(alertas);
  const acoes = [];

  for (const a of alertas) {
    if (a.tipo === 'geada') {
      acoes.push({
        titulo: 'Mitigar risco de geada',
        descricao: 'Avalie irrigação por aspersão na madrugada e monitore a previsão; culturas sensíveis podem sofrer dano foliar.',
        prioridade: 'alta',
        prazo: 'Próximas 48h',
      });
    } else if (a.tipo === 'calor_excessivo') {
      acoes.push({
        titulo: 'Reduzir estresse térmico',
        descricao: 'Concentre irrigação nas horas mais frescas e evite manejos que aumentem a transpiração no pico de calor.',
        prioridade: 'alta',
        prazo: 'Próximos dias',
      });
    } else if (a.tipo === 'estresse_hidrico') {
      acoes.push({
        titulo: 'Suplementar irrigação',
        descricao: 'A precipitação prevista está abaixo do necessário; planeje irrigação para evitar déficit hídrico.',
        prioridade: 'media',
        prazo: 'Esta semana',
      });
    }
  }

  if (acoes.length === 0) {
    const estagio = context.fenologia?.estagio ?? 'em desenvolvimento';
    acoes.push({
      titulo: 'Monitoramento de rotina',
      descricao: `Sem riscos climáticos relevantes na janela atual. Cultura em estágio ${estagio}; mantenha o monitoramento de pragas e o calendário agrícola.`,
      prioridade: 'baixa',
      prazo: 'Rotina',
    });
  }

  return {
    resumo: alertas.length
      ? `Foram identificados ${alertas.length} alerta(s) climático(s) para a cultura ${context.safra?.cultura}.`
      : `Condições estáveis para a cultura ${context.safra?.cultura} no momento.`,
    nivelRisco: nivelMarcadorParaRisco(nivelMarcador),
    acoes,
    fonte: 'regras',
  };
}
