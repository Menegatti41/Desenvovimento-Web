import { getCulture } from '../data/cultures.js';

// Avaliação de alertas de risco a partir da previsão diária.
// Função PURA: recebe a previsão e a cultura, devolve a lista de alertas.

const NIVEL = { ALTO: 'alto', MEDIO: 'medio', BAIXO: 'baixo' };

/**
 * @param {Array<{data:string, tmax:number, tmin:number, precipitacaoMm:number}>} previsao
 * @param {string} cultura
 * @returns {{cultura:string, alertas:Array, totalAlertas:number}|null}
 */
export function evaluateRisks(previsao, cultura) {
  const culture = getCulture(cultura);
  if (!culture) return null;

  const dias = Array.isArray(previsao) ? previsao : [];
  const alertas = [];

  // Risco de geada: alguma mínima abaixo do limite da cultura.
  const diasGeada = dias.filter((d) => Number(d.tmin) <= culture.geadaC);
  if (diasGeada.length > 0) {
    alertas.push({
      tipo: 'geada',
      nivel: NIVEL.ALTO,
      mensagem: `Risco de geada: ${diasGeada.length} dia(s) com mínima <= ${culture.geadaC}°C.`,
      dias: diasGeada.map((d) => d.data),
    });
  }

  // Estresse por calor: alguma máxima acima do limite da cultura.
  const diasCalor = dias.filter((d) => Number(d.tmax) >= culture.calorC);
  if (diasCalor.length > 0) {
    alertas.push({
      tipo: 'calor_excessivo',
      nivel: diasCalor.length >= 3 ? NIVEL.ALTO : NIVEL.MEDIO,
      mensagem: `Estresse por calor: ${diasCalor.length} dia(s) com máxima >= ${culture.calorC}°C.`,
      dias: diasCalor.map((d) => d.data),
    });
  }

  // Estresse hídrico: precipitação acumulada na janela abaixo do mínimo semanal.
  const chuvaTotal = dias.reduce((acc, d) => acc + (Number(d.precipitacaoMm) || 0), 0);
  const janelaDias = dias.length || 1;
  const minimoEsperado = (culture.chuvaMinimaSemanalMm / 7) * janelaDias;
  if (dias.length > 0 && chuvaTotal < minimoEsperado) {
    alertas.push({
      tipo: 'estresse_hidrico',
      nivel: chuvaTotal < minimoEsperado / 2 ? NIVEL.ALTO : NIVEL.MEDIO,
      mensagem: `Risco de estresse hídrico: ${chuvaTotal.toFixed(1)}mm previstos em ${janelaDias} dia(s) (esperado >= ${minimoEsperado.toFixed(1)}mm).`,
      chuvaPrevistaMm: Number(chuvaTotal.toFixed(1)),
      chuvaEsperadaMm: Number(minimoEsperado.toFixed(1)),
    });
  }

  return {
    cultura,
    janelaDias,
    alertas,
    totalAlertas: alertas.length,
  };
}
