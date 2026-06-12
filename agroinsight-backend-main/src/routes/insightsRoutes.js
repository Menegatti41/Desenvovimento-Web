import express from 'express';
import { getMapaInsights } from '../controllers/insightsController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { requirePermission } from '../middlewares/authorizationMiddleware.js';

const router = express.Router();

router.use(requireAuth);

// Mapa da produção: marcadores geolocalizados + GeoJSON.
router.get('/mapa', requirePermission('insights:read'), getMapaInsights);

export default router;
