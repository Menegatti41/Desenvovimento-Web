import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/sequelize.js';

// Safra = ciclo de cultivo registrado para um talhão.
export class Safra extends Model {}

Safra.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    // Cultura: Soja, Milho ou Trigo (validado contra src/data/cultures.js no controller).
    cultura: { type: DataTypes.STRING(60), allowNull: false },
    variedade: { type: DataTypes.STRING(120), allowNull: true },
    dataSemeadura: { type: DataTypes.DATEONLY, allowNull: false, field: 'dataSemeadura' },
    // Produtividade em sacas por hectare.
    produtividadeEstimada: {
      type: DataTypes.FLOAT,
      allowNull: true,
      field: 'produtividadeEstimada',
      validate: { min: 0 },
    },
    produtividadeReal: {
      type: DataTypes.FLOAT,
      allowNull: true,
      field: 'produtividadeReal',
      validate: { min: 0 },
    },
    // planejada -> em_andamento -> colhida
    status: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: 'planejada',
    },
    dataColheitaReal: { type: DataTypes.DATEONLY, allowNull: true, field: 'dataColheitaReal' },
    talhaoId: { type: DataTypes.INTEGER, allowNull: false, field: 'talhaoId' },
  },
  {
    sequelize,
    modelName: 'Safra',
    tableName: 'Safras',
    timestamps: true,
  },
);

export const STATUS_SAFRA = ['planejada', 'em_andamento', 'colhida'];
