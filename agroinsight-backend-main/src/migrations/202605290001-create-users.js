export async function up({ queryInterface, Sequelize }) {
  await queryInterface.createTable('Users', {
    id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: Sequelize.STRING(120), allowNull: false },
    email: { type: Sequelize.STRING(200), allowNull: false, unique: true },
    passwordHash: { type: Sequelize.STRING(255), allowNull: false, defaultValue: '' },
    role: { type: Sequelize.STRING(40), allowNull: false, defaultValue: 'produtor' },
    createdAt: { type: Sequelize.DATE, allowNull: false },
    updatedAt: { type: Sequelize.DATE, allowNull: false },
  });
}

export async function down({ queryInterface }) {
  await queryInterface.dropTable('Users');
}
