import { describe, expect, it } from 'vitest';
import { analyzePerformance } from '../../src/services/performance.service.js';

describe('performance.analyzePerformance', () => {
  it('indica indisponível sem produtividade real', () => {
    const r = analyzePerformance({ produtividadeEstimada: 60, produtividadeReal: null });
    expect(r.disponivel).toBe(false);
  });

  it('indica indisponível sem produtividade estimada', () => {
    const r = analyzePerformance({ produtividadeEstimada: null, produtividadeReal: 58 });
    expect(r.disponivel).toBe(false);
  });

  it('classifica abaixo do esperado quando real < estimada (desvio <= -5%)', () => {
    const r = analyzePerformance({ produtividadeEstimada: 62, produtividadeReal: 58.4, areaHectares: 100 });
    expect(r.disponivel).toBe(true);
    expect(r.avaliacao).toBe('abaixo_do_esperado');
    expect(r.desvioPercentual).toBeCloseTo(-5.8, 1);
    expect(r.producaoRealTotalSacas).toBe(5840);
  });

  it('classifica dentro do esperado para pequenos desvios', () => {
    const r = analyzePerformance({ produtividadeEstimada: 60, produtividadeReal: 61 });
    expect(r.avaliacao).toBe('dentro_do_esperado');
  });

  it('classifica acima do esperado quando real supera em >= 5%', () => {
    const r = analyzePerformance({ produtividadeEstimada: 60, produtividadeReal: 66 });
    expect(r.avaliacao).toBe('acima_do_esperado');
  });
});
