import { Safra, Talhao } from '../models/index.js';
import { asyncHandler } from '../middlewares/errorMiddleware.js';
import { analyzePerformance } from '../services/performance.service.js';
import { buildAgendaAgricola } from '../services/calendar.service.js';
import { STATUS_SAFRA } from '../models/safra.model.js';

function parseId(value) {
  return Number.parseInt(value, 10);
}

export const getCalendarioSafra = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const safra = await Safra.findByPk(id);

  if (!safra) {
    return res.status(404).json({ message: 'Safra não encontrada.' });
  }

  // 1. BLINDAGEM DE DATA: Garante que o serviço receba estritamente uma string 'YYYY-MM-DD'
  let dataPlantioLimpa = safra.dataSemeadura;
  
  if (dataPlantioLimpa instanceof Date) {
    dataPlantioLimpa = dataPlantioLimpa.toISOString().split('T')[0];
  } else if (typeof dataPlantioLimpa === 'string') {
    dataPlantioLimpa = dataPlantioLimpa.split('T')[0];
  }

  // 2. Chama o serviço com a data já higienizada
  const agenda = buildAgendaAgricola(safra.cultura, dataPlantioLimpa);

  if (!agenda) {
    return res.status(400).json({ message: 'Não foi possível gerar o calendário para esta cultura.' });
  }

  // 3. Formatação para o Front-end
  const operacoesFormatadas = agenda.eventos.map((evento, index) => {
    let status = 'pendente';
    if (index < 2 && safra.status !== 'planejada') {
      status = 'concluido';
    }

    return {
      id: `${safra.id}-${index}`,
      operacao: evento.atividade,
      dataPrevista: evento.data,
      status: status,
      recomendacao: evento.descricao
    };
  });

  return res.json(operacoesFormatadas);
});

// Carrega a safra junto do talhão (necessário para a checagem de propriedade).
async function loadSafraWithTalhao(id) {
  return Safra.findByPk(id, { include: [{ model: Talhao, as: 'talhao' }] });
}

function isOwnerOrAdmin(safra, authUser) {
  return authUser.role === 'admin' || safra.talhao?.userId === authUser.id;
}

export const getSafraById = asyncHandler(async (req, res) => {
  const safra = await loadSafraWithTalhao(parseId(req.params.id));
  if (!safra) return res.status(404).json({ message: 'Safra não encontrada' });
  if (!isOwnerOrAdmin(safra, req.authUser)) {
    return res.status(403).json({ message: 'Acesso negado a esta safra' });
  }
  res.json(safra);
});

export const updateSafra = asyncHandler(async (req, res) => {
  const safra = await loadSafraWithTalhao(parseId(req.params.id));
  if (!safra) return res.status(404).json({ message: 'Safra não encontrada' });
  if (!isOwnerOrAdmin(safra, req.authUser)) {
    return res.status(403).json({ message: 'Acesso negado a esta safra' });
  }

  const {
    variedade, produtividadeEstimada, produtividadeReal, status, dataColheitaReal,
  } = req.body;

  if (status !== undefined && !STATUS_SAFRA.includes(status)) {
    return res.status(400).json({ message: `status inválido. Use: ${STATUS_SAFRA.join(', ')}` });
  }

  if (variedade !== undefined) safra.variedade = variedade;
  if (produtividadeEstimada !== undefined) safra.produtividadeEstimada = produtividadeEstimada;
  if (produtividadeReal !== undefined) safra.produtividadeReal = produtividadeReal;
  if (status !== undefined) safra.status = status;
  if (dataColheitaReal !== undefined) safra.dataColheitaReal = dataColheitaReal;

  await safra.save();
  res.json(safra);
});

export const deleteSafra = asyncHandler(async (req, res) => {
  const safra = await loadSafraWithTalhao(parseId(req.params.id));
  if (!safra) return res.status(404).json({ message: 'Safra não encontrada' });
  if (!isOwnerOrAdmin(safra, req.authUser)) {
    return res.status(403).json({ message: 'Acesso negado a esta safra' });
  }

  await safra.destroy();
  res.status(204).send();
});

// Análise de performance: estimado x real (planejamento x colheita).
export const getSafraPerformance = asyncHandler(async (req, res) => {
  const safra = await loadSafraWithTalhao(parseId(req.params.id));
  if (!safra) return res.status(404).json({ message: 'Safra não encontrada' });
  if (!isOwnerOrAdmin(safra, req.authUser)) {
    return res.status(403).json({ message: 'Acesso negado a esta safra' });
  }

  const analise = analyzePerformance({
    produtividadeEstimada: safra.produtividadeEstimada,
    produtividadeReal: safra.produtividadeReal,
    areaHectares: safra.talhao?.areaHectares,
  });

  res.json({
    safraId: safra.id,
    cultura: safra.cultura,
    variedade: safra.variedade,
    status: safra.status,
    produtividadeEstimada: safra.produtividadeEstimada, 
    produtividadeReal: safra.produtividadeReal,
    variacao: analise?.variacao || analise?.percentual || 0, 
    performance: analise,
  });
});
