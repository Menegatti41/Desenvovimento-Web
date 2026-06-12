import { describe, expect, it } from 'vitest';
import { computeGDD, estimateStage, buildPhenology } from '../../src/services/phenology.service.js';
import { CULTURES } from '../../src/data/cultures.js';

describe('phenology.computeGDD', () => {
  it('soma graus-dia acima da temperatura base', () => {
    // média (30+20)/2 = 25; 25 - 10 = 15 por dia; 2 dias = 30
    const dias = [{ tmax: 30, tmin: 20 }, { tmax: 30, tmin: 20 }];
    expect(computeGDD(dias, 10)).toBe(30);
  });

  it('nunca contabiliza GDD negativo (dia frio)', () => {
    const dias = [{ tmax: 8, tmin: 4 }]; // média 6 < base 10
    expect(computeGDD(dias, 10)).toBe(0);
  });

  it('ignora dias com dados inválidos', () => {
    const dias = [{ tmax: 30, tmin: 20 }, { tmax: null, tmin: 20 }];
    expect(computeGDD(dias, 10)).toBe(15);
  });
});

describe('phenology.estimateStage', () => {
  const soja = CULTURES.Soja;

  it('classifica Vegetativo abaixo do limiar vegetativo', () => {
    expect(estimateStage(soja.gddVegetativo - 1, soja)).toBe('Vegetativo');
  });
  it('classifica Reprodutivo entre os limiares', () => {
    expect(estimateStage(soja.gddVegetativo + 1, soja)).toBe('Reprodutivo');
  });
  it('classifica Maturação/Colheita acima do limiar reprodutivo', () => {
    expect(estimateStage(soja.gddReprodutivo + 1, soja)).toBe('Maturação/Colheita');
  });
});

describe('phenology.buildPhenology', () => {
  it('retorna null para cultura inválida', () => {
    expect(buildPhenology('Cevada', [])).toBeNull();
  });

  it('monta resumo com estágio e progresso', () => {
    const dias = Array.from({ length: 30 }, () => ({ tmax: 30, tmin: 20 })); // 30 * 15 = 450 GDD
    const r = buildPhenology('Soja', dias);
    expect(r.gddAcumulado).toBe(450);
    expect(r.diasComputados).toBe(30);
    expect(r.estagio).toBe('Reprodutivo'); // 450 não é < 450
    expect(r.progressoCiclo).toBeGreaterThan(0);
  });
});
