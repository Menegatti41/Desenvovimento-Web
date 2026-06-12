export async function up({ queryInterface, Sequelize }) {
  await queryInterface.createTable('Talhoes', {
    id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    nome: { type: Sequelize.STRING(160), allowNull: false },
    latitude: { type: Sequelize.FLOAT, allowNull: false },
    longitude: { type: Sequelize.FLOAT, allowNull: false },
    areaHectares: { type: Sequelize.FLOAT, allowNull: false },
    userId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: { model: 'Users', key: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    createdAt: { type: Sequelize.DATE, allowNull: false },
    updatedAt: { type: Sequelize.DATE, allowNull: false },
  });
}

export async function down({ queryInterface }) {
  await queryInterface.dropTable('Talhoes');
}
