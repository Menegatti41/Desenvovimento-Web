import express from 'express';
import cors from 'cors';
import { initModels } from './models/index.js';
import authRoutes from './routes/authRoutes.js';
import talhaoRoutes from './routes/talhaoRoutes.js';
import safraRoutes from './routes/safraRoutes.js';
import insightsRoutes from './routes/insightsRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import { notFoundHandler, errorHandler } from './middlewares/errorMiddleware.js';

// Inicializa as associações entre os models uma única vez.
initModels();

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Healthcheck simples.
  app.get('/', (req, res) => {
    res.json({ service: 'AgroInsight API', status: 'ok' });
  });

  app.use('/auth', authRoutes);
  app.use('/talhoes', talhaoRoutes);
  app.use('/safras', safraRoutes);
  app.use('/insights', insightsRoutes);
  app.use('/dashboard', dashboardRoutes);

  // Tratamento de rota inexistente e de erros (devem vir por último).
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
