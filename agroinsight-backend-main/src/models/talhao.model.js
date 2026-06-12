import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/sequelize.js';

// Talhão = área de plantio delimitada por coordenadas geográficas.
export class Talhao extends Model {}

Talhao.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nome: { type: DataTypes.STRING(160), allowNull: false },
    latitude: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: { min: -90, max: 90 },
    },
    longitude: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: { min: -180, max: 180 },
    },
    areaHectares: {
      type: DataTypes.FLOAT,
      allowNull: false,
      field: 'areaHectares',
      validate: { min: 0 },
    },
    // Dono do talhão (produtor rural).
    userId: { type: DataTypes.INTEGER, allowNull: false, field: 'userId' },
  },
  {
    sequelize,
    modelName: 'Talhao',
    tableName: 'Talhoes',
    timestamps: true,
  },
);
