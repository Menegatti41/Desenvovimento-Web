import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/sequelize.js';

export class User extends Model {}

User.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(120), allowNull: false },
    email: {
      type: DataTypes.STRING(200),
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    // Nunca deve ser retornado em respostas públicas (ver sanitizeUser no controller).
    passwordHash: { type: DataTypes.STRING(255), allowNull: false, field: 'passwordHash' },
    // Perfil de acesso (RBAC): 'admin' ou 'produtor'.
    role: { type: DataTypes.STRING(40), allowNull: false, defaultValue: 'produtor' },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'Users',
    timestamps: true,
  },
);
