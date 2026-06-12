import express from 'express';
import {
  getSafraById,
  updateSafra,
  deleteSafra,
  getSafraPerformance,
} from '../controllers/safraController.js';
import {
  getFenologiaBySafra,
  getAlertasBySafra,
  getCalendarioBySafra,
  getRecomendacaoBySafra,
} from '../controllers/insightsController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { requirePermission } from '../middlewares/authorizationMiddleware.js';

const router = express.Router();

router.use(requireAuth);

router.get('/:id', requirePermission('safras:read'), getSafraById);
router.put('/:id', requirePermission('safras:update'), updateSafra);
router.delete('/:id', requirePermission('safras:delete'), deleteSafra);

// Painel de insights inteligentes da safra.
router.get('/:id/fenologia', requirePermission('insights:read'), getFenologiaBySafra);
router.get('/:id/alertas', requirePermission('insights:read'), getAlertasBySafra);
router.get('/:id/calendario', requirePermission('insights:read'), getCalendarioBySafra);

// Recomendação inteligente gerada por LLM (Gemini), com fallback por regras.
router.get('/:id/recomendacao', requirePermission('insights:read'), getRecomendacaoBySafra);

// Análise de performance (estimado x real).
router.get('/:id/performance', requirePermission('safras:read'), getSafraPerformance);

export default router;
