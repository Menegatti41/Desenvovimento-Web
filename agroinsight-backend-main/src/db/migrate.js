import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sequelize } from '../config/sequelize.js';
import { run } from './runner.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.resolve(__dirname, '../migrations');

try {
  await run(migrationsDir, 'SequelizeMigrations');
  await sequelize.close();
} catch (err) {
  console.error('[migrate] falha ao aplicar migrations:', err);
  process.exitCode = 1;
  await sequelize.close();
}
