import { describe, expect, it } from 'vitest';
import { buildAgendaAgricola } from '../../src/services/calendar.service.js';

describe('calendar.buildAgendaAgricola', () => {
  it('retorna null para cultura inválida', () => {
    expect(buildAgendaAgricola('Cevada', '2026-01-01')).toBeNull();
  });

  it('retorna null sem data de semeadura', () => {
    expect(buildAgendaAgricola('Soja', null)).toBeNull();
  });

  it('gera eventos com a colheita ao fim do ciclo da Soja (120 dias)', () => {
    const agenda = buildAgendaAgricola('Soja', '2025-10-15');
    expect(agenda.cicloDias).toBe(120);
    const colheita = agenda.eventos.find((e) => e.atividade.includes('colheita'));
    // 2025-10-15 + 120 dias = 2026-02-12
    expect(colheita.data).toBe('2026-02-12');
  });

  it('o primeiro evento é no dia da semeadura', () => {
    const agenda = buildAgendaAgricola('Milho', '2026-02-20');
    expect(agenda.eventos[0].data).toBe('2026-02-20');
  });
});
