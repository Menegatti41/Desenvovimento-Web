import express from 'express';
import {
  getAllTalhoes,
  getTalhaoById,
  createTalhao,
  updateTalhao,
  deleteTalhao,
  getSafrasByTalhao,
  createSafraForTalhao,
} from '../controllers/talhaoController.js';
import { getClimaByTalhao } from '../controllers/insightsController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { requirePermission } from '../middlewares/authorizationMiddleware.js';

const router = express.Router();

// Todas as rotas de talhão exigem autenticação.
router.use(requireAuth);

router.get('/', requirePermission('talhoes:read'), getAllTalhoes);
router.post('/', requirePermission('talhoes:create'), createTalhao);
router.get('/:id', requirePermission('talhoes:read'), getTalhaoById);
router.put('/:id', requirePermission('talhoes:update'), updateTalhao);
router.delete('/:id', requirePermission('talhoes:delete'), deleteTalhao);

// 1 -> N: safras de um talhão.
router.get('/:id/safras', requirePermission('safras:read'), getSafrasByTalhao);
router.post('/:id/safras', requirePermission('safras:create'), createSafraForTalhao);

// Insight climático do talhão.
router.get('/:id/clima', requirePermission('insights:read'), getClimaByTalhao);

export default router;
