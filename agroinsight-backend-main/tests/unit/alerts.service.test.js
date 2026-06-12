import { describe, expect, it } from 'vitest';
import { evaluateRisks } from '../../src/services/alerts.service.js';

function tipos(resultado) {
  return resultado.alertas.map((a) => a.tipo);
}

describe('alerts.evaluateRisks', () => {
  it('retorna null para cultura inválida', () => {
    expect(evaluateRisks([], 'Cevada')).toBeNull();
  });

  it('detecta risco de geada (mínima abaixo do limite da Soja)', () => {
    const previsao = [{ data: '2026-06-01', tmax: 18, tmin: 1, precipitacaoMm: 5 }];
    const r = evaluateRisks(previsao, 'Soja');
    expect(tipos(r)).toContain('geada');
  });

  it('detecta estresse por calor (máxima acima do limite)', () => {
    const previsao = [{ data: '2026-01-10', tmax: 38, tmin: 24, precipitacaoMm: 10 }];
    const r = evaluateRisks(previsao, 'Soja');
    expect(tipos(r)).toContain('calor_excessivo');
  });

  it('detecta estresse hídrico quando chuva fica abaixo do esperado', () => {
    // 7 dias, esperado >= 20mm para Soja; previsão soma 2mm
    const previsao = Array.from({ length: 7 }, (_, i) => ({
      data: `2026-01-0${i + 1}`, tmax: 28, tmin: 18, precipitacaoMm: i === 0 ? 2 : 0,
    }));
    const r = evaluateRisks(previsao, 'Soja');
    expect(tipos(r)).toContain('estresse_hidrico');
  });

  it('não gera alertas em condições ideais', () => {
    const previsao = Array.from({ length: 7 }, () => ({
      data: '2026-01-01', tmax: 28, tmin: 18, precipitacaoMm: 5,
    }));
    const r = evaluateRisks(previsao, 'Soja');
    expect(r.totalAlertas).toBe(0);
  });
});
