import fs from 'node:fs';
import path from 'node:path';
import { Sequelize } from 'sequelize';

// O banco SQLite fica em data/database.sqlite na raiz do projeto.
// Em ambiente de teste usamos um arquivo separado para não sujar os dados de dev.
const dataDir = path.resolve(process.cwd(), 'data');
const fileName = process.env.NODE_ENV === 'test' ? 'database.test.sqlite' : 'database.sqlite';
const storage = path.join(dataDir, fileName);

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
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
