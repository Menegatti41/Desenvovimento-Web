import { Safra, Talhao } from '../models/index.js';
import { asyncHandler } from '../middlewares/errorMiddleware.js';
import { analyzePerformance } from '../services/performance.service.js';
import { STATUS_SAFRA } from '../models/safra.model.js';

function parseId(value) {
  return Number.parseInt(value, 10);
}

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
    performance: analise,
  });
});
