import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { generateAdvisory, isConfigured, setFetchImpl } from '../../src/services/llm.service.js';

const CONTEXT = {
  talhao: { nome: 'Norte' },
  safra: { cultura: 'Soja' },
  alertas: [],
};

// Resposta no formato que a Gemini retorna (texto JSON dentro de candidates).
function geminiResponse(payload) {
  return {
    ok: true,
    status: 200,
    json: async () => ({
      candidates: [{ content: { parts: [{ text: JSON.stringify(payload) }] } }],
    }),
  };
}

describe('llm.service', () => {
  const original = process.env.GEMINI_API_KEY;

  beforeEach(() => {
    process.env.GEMINI_API_KEY = 'fake-key';
  });
  afterEach(() => {
    if (original === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = original;
  });

  it('isConfigured reflete a presença da chave', () => {
    expect(isConfigured()).toBe(true);
    delete process.env.GEMINI_API_KEY;
    expect(isConfigured()).toBe(false);
  });

  it('lança erro sem chave configurada', async () => {
    delete process.env.GEMINI_API_KEY;
    await expect(generateAdvisory(CONTEXT)).rejects.toThrow(/GEMINI_API_KEY/);
  });

  it('faz parse da resposta da Gemini e marca a fonte', async () => {
    const fetchMock = vi.fn().mockResolvedValue(geminiResponse({
      resumo: 'Tudo certo',
      nivelRisco: 'baixo',
      acoes: [{ titulo: 'Monitorar', descricao: '...', prioridade: 'baixa' }],
    }));
    setFetchImpl(fetchMock);

    const r = await generateAdvisory(CONTEXT);
    expect(r.fonte).toBe('gemini');
    expect(r.nivelRisco).toBe('baixo');
    expect(r.acoes[0].titulo).toBe('Monitorar');
    // confirma que a URL chamada inclui o modelo e a key
    const calledUrl = fetchMock.mock.calls[0][0];
    expect(calledUrl).toContain('generateContent');
    expect(calledUrl).toContain('key=fake-key');
  });

  it('propaga erro quando a API responde não-ok', async () => {
    setFetchImpl(vi.fn().mockResolvedValue({ ok: false, status: 429, json: async () => ({}) }));
    await expect(generateAdvisory(CONTEXT)).rejects.toThrow(/429/);
  });
});
