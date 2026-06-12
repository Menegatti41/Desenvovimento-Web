// Camada de I/O com a LLM (Google Gemini).
// Concentra a chamada HTTP; o contexto/prompt vêm prontos do advisory.service (puro).
//
// Requer a variável de ambiente GEMINI_API_KEY (gratuita no Google AI Studio:
// https://aistudio.google.com/app/apikey). Sem a chave, o controller usa o
// fallback baseado em regras do advisory.service.

import { buildPrompt } from './advisory.service.js';

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const DEFAULT_MODEL = 'gemini-2.0-flash';

// Schema (subconjunto OpenAPI aceito pela Gemini) para forçar saída JSON estruturada.
const ADVISORY_SCHEMA = {
  type: 'OBJECT',
  properties: {
    resumo: { type: 'STRING' },
    nivelRisco: { type: 'STRING', enum: ['baixo', 'medio', 'alto'] },
    acoes: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          titulo: { type: 'STRING' },
          descricao: { type: 'STRING' },
          prioridade: { type: 'STRING', enum: ['alta', 'media', 'baixa'] },
          prazo: { type: 'STRING' },
        },
        required: ['titulo', 'descricao', 'prioridade'],
      },
    },
  },
  required: ['resumo', 'nivelRisco', 'acoes'],
};

// Permite injetar fetch em testes; por padrão usa o fetch global (Node 18+).
let fetchImpl = globalThis.fetch;
export function setFetchImpl(fn) {
  fetchImpl = fn;
}

// Lido em tempo de chamada (e não no import) para refletir o ambiente atual.
export function isConfigured() {
  return Boolean(process.env.GEMINI_API_KEY);
}

/**
 * Gera a recomendação agronômica via Gemini.
 * @param {object} context contexto montado por advisory.buildContext
 * @returns {Promise<{resumo:string, nivelRisco:string, acoes:Array, fonte:'gemini'}>}
 * @throws se a chave não estiver configurada ou a API falhar.
 */
export async function generateAdvisory(context) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY não configurada');
  }

  const model = process.env.GEMINI_MODEL ?? DEFAULT_MODEL;
  const url = `${GEMINI_BASE}/${model}:generateContent?key=${apiKey}`;

  const body = {
    contents: [{ parts: [{ text: buildPrompt(context) }] }],
    generationConfig: {
      temperature: 0.4,
      responseMimeType: 'application/json',
      responseSchema: ADVISORY_SCHEMA,
    },
  };

  const res = await fetchImpl(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Gemini respondeu ${res.status}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Resposta da Gemini sem conteúdo');
  }

  const parsed = JSON.parse(text);
  return { ...parsed, fonte: 'gemini' };
}
