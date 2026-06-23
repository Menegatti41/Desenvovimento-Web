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
import { getCalendarioSafra } from '../controllers/safraController.js';
import { CULTURAS_SUPORTADAS } from '../data/cultures.js';


const router = express.Router();


router.use(requireAuth);
router.get('/culturas-suportadas', (req, res, next) => {
  try {
    return res.json(CULTURAS_SUPORTADAS);
  } catch (error) {
    // Se der erro aqui, o "next(error)" joga o erro para o seuerrorHandler global do app.js
    next(error); 
  }
});

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

// Calendário
router.get('/:id/calendario', requirePermission('safras:read'), getCalendarioSafra);

export default router;
