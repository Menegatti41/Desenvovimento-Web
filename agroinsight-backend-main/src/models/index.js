import { User } from './user.model.js';
import { Talhao } from './talhao.model.js';
import { Safra } from './safra.model.js';

let initialized = false;

export function initModels() {
  if (initialized) return;

  // 1 -> N: um usuário (produtor) possui vários talhões.
  User.hasMany(Talhao, { as: 'talhoes', foreignKey: 'userId', onDelete: 'CASCADE' });
  Talhao.belongsTo(User, { as: 'owner', foreignKey: 'userId' });

  // 1 -> N: um talhão registra várias safras ao longo do tempo.
  Talhao.hasMany(Safra, { as: 'safras', foreignKey: 'talhaoId', onDelete: 'CASCADE' });
  Safra.belongsTo(Talhao, { as: 'talhao', foreignKey: 'talhaoId' });

  initialized = true;
}

export { User, Talhao, Safra };
