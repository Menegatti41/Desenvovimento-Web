import { Talhao, Safra, User } from '../models/index.js';
import { asyncHandler } from '../middlewares/errorMiddleware.js';
import { isCulturaValida, CULTURAS_SUPORTADAS } from '../data/cultures.js';
import { STATUS_SAFRA } from '../models/safra.model.js';
import { Op } from 'sequelize'; // <- Importação adicionada aqui no topo

function parseId(value) {
  return Number.parseInt(value, 10);
}

// Admin enxerga tudo; produtor apenas os próprios talhões.
function isOwnerOrAdmin(talhao, authUser) {
  return authUser.role === 'admin' || talhao.userId === authUser.id;
}

// Filtro de escopo aplicado nas listagens.
function scopeWhere(authUser) {
  return authUser.role === 'admin' ? {} : { userId: authUser.id };
}

export const getAllTalhoes = asyncHandler(async (req, res) => {
  const talhoes = await Talhao.findAll({
    where: scopeWhere(req.authUser),
    order: [['id', 'ASC']],
  });
  res.json(talhoes);
});

export const getTalhaoById = asyncHandler(async (req, res) => {
  const talhao = await Talhao.findByPk(parseId(req.params.id), {
    include: [
      { model: Safra, as: 'safras' },
      { model: User, as: 'owner', attributes: ['id', 'name', 'email'] },
    ],
  });

  if (!talhao) return res.status(404).json({ message: 'Talhão não encontrado' });
  if (!isOwnerOrAdmin(talhao, req.authUser)) {
    return res.status(403).json({ message: 'Acesso negado a este talhão' });
  }
  res.json(talhao);
});

export const createTalhao = asyncHandler(async (req, res) => {
  const { nome, latitude, longitude, areaHectares } = req.body;

  if (!nome || latitude === undefined || longitude === undefined || areaHectares === undefined) {
    return res.status(400).json({
      message: 'nome, latitude, longitude e areaHectares são obrigatórios',
    });
  }

  const talhao = await Talhao.create({
    nome,
    latitude,
    longitude,
    areaHectares,
    userId: req.authUser.id, // o dono é sempre o usuário autenticado
  });
  res.status(201).json(talhao);
});

export const updateTalhao = asyncHandler(async (req, res) => {
  const talhao = await Talhao.findByPk(parseId(req.params.id));
  if (!talhao) return res.status(404).json({ message: 'Talhão não encontrado' });
  if (!isOwnerOrAdmin(talhao, req.authUser)) {
    return res.status(403).json({ message: 'Acesso negado a este talhão' });
  }

  const { nome, latitude, longitude, areaHectares } = req.body;
  if (nome !== undefined) talhao.nome = nome;
  if (latitude !== undefined) talhao.latitude = latitude;
  if (longitude !== undefined) talhao.longitude = longitude;
  if (areaHectares !== undefined) talhao.areaHectares = areaHectares;

  await talhao.save();
  res.json(talhao);
});

export const deleteTalhao = asyncHandler(async (req, res) => {
  const talhao = await Talhao.findByPk(parseId(req.params.id));
  if (!talhao) return res.status(404).json({ message: 'Talhão não encontrado' });
  if (!isOwnerOrAdmin(talhao, req.authUser)) {
    return res.status(403).json({ message: 'Acesso negado a este talhão' });
  }

  await talhao.destroy();
  res.status(204).send();
});

// 1 -> N: listar safras de um talhão.
export const getSafrasByTalhao = asyncHandler(async (req, res) => {
  const talhao = await Talhao.findByPk(parseId(req.params.id));
  if (!talhao) return res.status(404).json({ message: 'Talhão não encontrado' });
  if (!isOwnerOrAdmin(talhao, req.authUser)) {
    return res.status(403).json({ message: 'Acesso negado a este talhão' });
  }

  const safras = await Safra.findAll({
    where: { talhaoId: talhao.id },
    order: [['dataSemeadura', 'DESC']],
  });
  res.json(safras);
});

// 1 -> N: criar safra para um talhão.
export const createSafraForTalhao = asyncHandler(async (req, res) => {
  const talhao = await Talhao.findByPk(parseId(req.params.id));
  if (!talhao) return res.status(404).json({ message: 'Talhão não encontrado' });
  if (!isOwnerOrAdmin(talhao, req.authUser)) {
    return res.status(403).json({ message: 'Acesso negado a este talhão' });
  }

  const { cultura, variedade, dataSemeadura, produtividadeEstimada, status } = req.body;

  if (!cultura || !dataSemeadura) {
    return res.status(400).json({ message: 'cultura e dataSemeadura são obrigatórios' });
  }
  if (!isCulturaValida(cultura)) {
    return res.status(400).json({
      message: `cultura inválida. Use uma de: ${CULTURAS_SUPORTADAS.join(', ')}`,
    });
  }
  if (status !== undefined && !STATUS_SAFRA.includes(status)) {
    return res.status(400).json({ message: `status inválido. Use: ${STATUS_SAFRA.join(', ')}` });
  }

  const safra = await Safra.create({
    cultura,
    variedade,
    dataSemeadura,
    produtividadeEstimada,
    status: status ?? 'planejada',
    talhaoId: talhao.id,
  });
  res.status(201).json(safra);
});

// ==========================================
// NOVA FUNÇÃO DO DASHBOARD ADICIONADA ABAIXO:
// ==========================================
export const getDashboardSummary = asyncHandler(async (req, res) => {
  const userId = req.authUser.id;

  // 1. Busca todos os talhões que pertencem a este usuário
  const meusTalhoes = await Talhao.findAll({
    where: { userId },
    attributes: ['id']
  });

  const totalTalhoes = meusTalhoes.length;
  const talhaoIds = meusTalhoes.map(t => t.id);

  // 2. Conta as safras baseando-se nos IDs coletados
  let safrasAtivas = 0;
  
  if (talhaoIds.length > 0) {
    safrasAtivas = await Safra.count({
      where: {
        talhaoId: { [Op.in]: talhaoIds },
        status: { [Op.in]: ['planejada', 'em_andamento'] } // Filtros corretos sem espaço
      }
    });
  }

  return res.json({
    totalTalhoes,
    safrasAtivas,
    clima: "Bom"
  });
});