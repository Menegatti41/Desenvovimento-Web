export async function up({ queryInterface, Sequelize }) {
  await queryInterface.createTable('Safras', {
    id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    cultura: { type: Sequelize.STRING(60), allowNull: false },
    variedade: { type: Sequelize.STRING(120), allowNull: true },
    dataSemeadura: { type: Sequelize.DATEONLY, allowNull: false },
    produtividadeEstimada: { type: Sequelize.FLOAT, allowNull: true },
    produtividadeReal: { type: Sequelize.FLOAT, allowNull: true },
    status: { type: Sequelize.STRING(30), allowNull: false, defaultValue: 'planejada' },
    dataColheitaReal: { type: Sequelize.DATEONLY, allowNull: true },
    talhaoId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: { model: 'Talhoes', key: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    createdAt: { type: Sequelize.DATE, allowNull: false },
    updatedAt: { type: Sequelize.DATE, allowNull: false },
  });
}

export async function down({ queryInterface }) {
  await queryInterface.dropTable('Safras');
}
