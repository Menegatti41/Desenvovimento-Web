import { getCulture } from '../data/cultures.js';

// Cálculo do ciclo fenológico via graus-dia (GDD - Growing Degree Days).
//
// GDD diário = max(0, (Tmax + Tmin) / 2 - Tbase)
// O somatório dos GDD desde a semeadura indica o estágio fenológico da planta.
// Estas funções são PURAS: recebem as séries de temperatura como argumento, sem I/O.

/**
 * Calcula o GDD acumulado a partir de séries diárias de temperatura.
 * @param {Array<{tmax:number, tmin:number}>} dias
 * @param {number} tBase
 * @returns {number} GDD acumulado (>= 0)
 */
export function computeGDD(dias, tBase) {
  if (!Array.isArray(dias)) return 0;
  return dias.reduce((acc, dia) => {
    const tmax = Number(dia?.tmax);
    const tmin = Number(dia?.tmin);
    if (!Number.isFinite(tmax) || !Number.isFinite(tmin)) return acc;
    const media = (tmax + tmin) / 2;
    return acc + Math.max(0, media - tBase);
  }, 0);
}

/**
 * Determina o estágio fenológico a partir do GDD acumulado e dos limiares da cultura.
 * @param {number} gddAcumulado
 * @param {object} culture parâmetros de src/data/cultures.js
 * @returns {'Vegetativo'|'Reprodutivo'|'Maturação/Colheita'}
 */
export function estimateStage(gddAcumulado, culture) {
  if (gddAcumulado < culture.gddVegetativo) return 'Vegetativo';
  if (gddAcumulado < culture.gddReprodutivo) return 'Reprodutivo';
  return 'Maturação/Colheita';
}

/**
 * Monta o resumo fenológico completo da safra.
 * @param {string} cultura
 * @param {Array<{tmax:number, tmin:number}>} diasDesdeSemeadura
 * @returns {object|null} null se a cultura for inválida.
 */
export function buildPhenology(cultura, diasDesdeSemeadura) {
  const culture = getCulture(cultura);
  if (!culture) return null;

  const gddAcumulado = computeGDD(diasDesdeSemeadura, culture.tBase);
  const estagio = estimateStage(gddAcumulado, culture);
  const progresso = Math.min(1, gddAcumulado / culture.gddReprodutivo);

  return {
    cultura,
    diasComputados: Array.isArray(diasDesdeSemeadura) ? diasDesdeSemeadura.length : 0,
    gddAcumulado: Number(gddAcumulado.toFixed(1)),
    gddParaReproducao: culture.gddVegetativo,
    gddParaMaturacao: culture.gddReprodutivo,
    estagio,
    progressoCiclo: Number((progresso * 100).toFixed(1)),
  };
}
