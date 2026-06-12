import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { Sequelize } from 'sequelize';
import { sequelize, enableForeignKeys } from '../config/sequelize.js';

// Runner genérico de migrations/seeders.
//
// Lê os arquivos .js de um diretório em ordem alfabética (por isso o prefixo de
// timestamp no nome) e executa o `up` apenas dos que ainda não foram aplicados.
// O controle do que já rodou fica em uma tabela própria (SequelizeMigrations /
// SequelizeSeeders), garantindo que cada arquivo rode uma única vez.
async function ensureTrackingTable(tableName) {
  await sequelize.getQueryInterface().createTable(tableName, {
    name: { type: Sequelize.STRING, primaryKey: true, allowNull: false },
    appliedAt: { type: Sequelize.DATE, allowNull: false },
  });
}

async function getApplied(tableName) {
  const [rows] = await sequelize.query(`SELECT name FROM "${tableName}"`);
  return new Set(rows.map((r) => r.name));
}

function listFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.js'))
    .sort();
}

/**
 * Executa todos os arquivos pendentes de um diretório.
 * @param {string} dir       Diretório com os arquivos (migrations ou seeders).
 * @param {string} tableName Tabela de controle (SequelizeMigrations / SequelizeSeeders).
 */
export async function run(dir, tableName) {
  await enableForeignKeys();
  await ensureTrackingTable(tableName);

  const applied = await getApplied(tableName);
  const files = listFiles(dir);
  const queryInterface = sequelize.getQueryInterface();

  let count = 0;
  for (const file of files) {
    if (applied.has(file)) continue;

    const mod = await import(pathToFileURL(path.join(dir, file)).href);
    if (typeof mod.up !== 'function') {
      console.warn(`[runner] ${file} não exporta up(), ignorando.`);
      continue;
    }

    console.log(`[runner] aplicando ${file} ...`);
    await mod.up({ queryInterface, Sequelize });
    await sequelize.query(`INSERT INTO "${tableName}" (name, appliedAt) VALUES (?, ?)`, {
      replacements: [file, new Date()],
    });
    count += 1;
  }

  if (count === 0) {
    console.log(`[runner] nada pendente em ${path.basename(dir)}.`);
  } else {
    console.log(`[runner] ${count} arquivo(s) aplicado(s) em ${path.basename(dir)}.`);
  }
}
