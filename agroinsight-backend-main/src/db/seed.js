import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sequelize } from '../config/sequelize.js';
import { run } from './runner.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const seedersDir = path.resolve(__dirname, '../seeders');

try {
  await run(seedersDir, 'SequelizeSeeders');
  await sequelize.close();
} catch (err) {
  console.error('[seed] falha ao aplicar seeders:', err);
  process.exitCode = 1;
  await sequelize.close();
}
