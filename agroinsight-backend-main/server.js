import 'dotenv/config';
import { createApp } from './src/app.js';
import { sequelize, enableForeignKeys } from './src/config/sequelize.js';

const port = Number.parseInt(process.env.PORT ?? '3000', 10);

async function start() {
  // Garante o PRAGMA de foreign keys na conexão usada pela API.
  await enableForeignKeys();
  await sequelize.authenticate();

  const app = createApp();
  app.listen(port, () => {
    console.log(`AgroInsight API rodando em http://localhost:${port}`);
  });
}

start().catch((err) => {
  console.error('[server] falha ao iniciar:', err);
  process.exit(1);
});
