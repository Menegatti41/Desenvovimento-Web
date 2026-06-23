import { getCulture } from '../data/cultures.js';

// Geração do calendário agrícola a partir da cultura e da data de semeadura.
// Função PURA (não consulta data atual nem rede): os offsets são proporcionais
// ao ciclo da cultura.

function addDays(dateInput, days) {
  const d = new Date(dateInput);
  
  // BLINDAGEM CONTRA O ERRO 500: Garante que os dias a somar sejam um número de verdade.
  const diasValidos = Number.isFinite(days) ? days : 0;
  
  if (isNaN(d.getTime())) {
    const hoje = new Date();
    hoje.setUTCDate(hoje.getUTCDate() + diasValidos);
    return hoje.toISOString().split('T')[0];
  }

  d.setUTCDate(d.getUTCDate() + diasValidos);
  return d.toISOString().split('T')[0];
}

export function buildAgendaAgricola(cultura, dataSemeadura) {
  const culture = getCulture(cultura);
  if (!culture || !dataSemeadura) return null;

  // CORREÇÃO: Tenta encontrar os dias do ciclo com vários nomes comuns. 
  // Se mesmo assim não achar no banco, usa 120 dias como padrão de emergência.
  const ciclo = Number(culture.cicloDias) || Number(culture.ciclo) || Number(culture.diasMedios) || 120;

  const eventos = [
    {
      atividade: 'Adubação de base / plantio',
      data: dataSemeadura,
      descricao: 'Aplicação no plantio, junto à semeadura.',
    },
    {
      atividade: 'Adubação de cobertura',
      data: addDays(dataSemeadura, Math.round(ciclo * 0.20)),
      descricao: 'Reforço de nitrogênio durante a fase vegetativa.',
    },
    {
      atividade: 'Aplicação de defensivos (manejo fitossanitário)',
      data: addDays(dataSemeadura, Math.round(ciclo * 0.33)),
      descricao: 'Monitoramento e controle de pragas/doenças no início do desenvolvimento.',
    },
    {
      atividade: 'Início da fase reprodutiva (florescimento)',
      data: addDays(dataSemeadura, Math.round(ciclo * 0.50)),
      descricao: 'Janela crítica para água e nutrientes; evitar estresses.',
    },
    {
      atividade: 'Janela de colheita estimada',
      data: addDays(dataSemeadura, ciclo),
      descricao: 'Maturação fisiológica concluída; planejar logística de colheita.',
    },
  ];

  return {
    cultura,
    dataSemeadura,
    cicloDias: ciclo,
    eventos,
  };
}
