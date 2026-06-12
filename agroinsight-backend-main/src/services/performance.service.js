// Análise de performance: comparativo entre produtividade estimada (planejamento)
// e produtividade real (colheita). Função PURA.

/**
 * @param {{produtividadeEstimada:?number, produtividadeReal:?number, areaHectares:?number}} safra
 * @returns {object}
 */
// Converte para número tratando null/undefined/'' como ausente (NaN),
// já que Number(null) === 0 passaria indevidamente em Number.isFinite.
function toNum(value) {
  if (value === null || value === undefined || value === '') return NaN;
  return Number(value);
}

export function analyzePerformance(safra) {
  const estimada = toNum(safra?.produtividadeEstimada);
  const real = toNum(safra?.produtividadeReal);
  const area = toNum(safra?.areaHectares);

  if (!Number.isFinite(real)) {
    return {
      disponivel: false,
      mensagem: 'Produtividade real ainda não registrada (safra não colhida).',
      produtividadeEstimada: Number.isFinite(estimada) ? estimada : null,
      produtividadeReal: null,
    };
  }

  if (!Number.isFinite(estimada) || estimada === 0) {
    return {
      disponivel: false,
      mensagem: 'Produtividade estimada ausente; não é possível comparar.',
      produtividadeEstimada: null,
      produtividadeReal: real,
    };
  }

  const diferenca = real - estimada;
  const desvioPercentual = (diferenca / estimada) * 100;

  let avaliacao;
  if (desvioPercentual >= 5) avaliacao = 'acima_do_esperado';
  else if (desvioPercentual <= -5) avaliacao = 'abaixo_do_esperado';
  else avaliacao = 'dentro_do_esperado';

  const resultado = {
    disponivel: true,
    produtividadeEstimada: estimada,
    produtividadeReal: real,
    diferencaSacasHa: Number(diferenca.toFixed(2)),
    desvioPercentual: Number(desvioPercentual.toFixed(1)),
    avaliacao,
  };

  if (Number.isFinite(area) && area > 0) {
    resultado.areaHectares = area;
    resultado.producaoEstimadaTotalSacas = Number((estimada * area).toFixed(1));
    resultado.producaoRealTotalSacas = Number((real * area).toFixed(1));
  }

  return resultado;
}
