import express from 'express';
import { getDashboardSummary } from '../controllers/talhaoController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';
// Caso você tenha criado uma permissão específica para o dashboard, importe a linha abaixo também:
// import { requirePermission } from '../middlewares/authorizationMiddleware.js';

const router = express.Router();

// 1. Exige que o usuário esteja logado (usa o mesmo padrão do talhaoRoutes)
router.use(requireAuth);

// 2. Define a rota apontando para a nossa função corrigida
// Se o seu sistema exigir permissão para o dashboard, você pode usar: 
// router.get('/', requirePermission('dashboard:read'), getDashboardSummary);
router.get('/', getDashboardSummary);

export default router;