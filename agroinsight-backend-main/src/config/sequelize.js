import fs from 'node:fs';
import path from 'node:path';
import { Sequelize } from 'sequelize';

let storage;

// 1. SE houver uma variável de ambiente definida (ex: na nuvem), usa o caminho absoluto dela
if (process.env.DATABASE_STORAGE_PATH) {
  storage = process.env.DATABASE_STORAGE_PATH;
} else {
  // 2. CASO CONTRÁRIO (no seu computador local), mantém o comportamento original na pasta /data
  const dataDir = path.resolve(process.cwd(), 'data');
  const fileName = process.env.NODE_ENV === 'test' ? 'database.test.sqlite' : 'database.sqlite';
  storage = path.join(dataDir, fileName);
}

// Garante que a pasta de destino exista (seja local ou na nuvem)
const targetDir = path.dirname(storage);
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

export const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage,
  logging: false,
});

// SQLite não respeita foreign keys por padrão; é preciso ligar o PRAGMA por conexão.
export async function enableForeignKeys() {
  await sequelize.query('PRAGMA foreign_keys = ON;');
}
