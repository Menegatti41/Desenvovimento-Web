import bcrypt from 'bcryptjs';

// Senha padrão dos usuários de exemplo: "123456"
export async function up({ queryInterface }) {
  const now = new Date();
  const passwordHash = await bcrypt.hash('123456', 10);

  await queryInterface.bulkInsert('Users', [
    { id: 1, name: 'Administrador', email: 'admin@agroinsight.com', passwordHash, role: 'admin', createdAt: now, updatedAt: now },
    { id: 2, name: 'João Produtor', email: 'joao@fazenda.com', passwordHash, role: 'produtor', createdAt: now, updatedAt: now },
    { id: 3, name: 'Maria Produtora', email: 'maria@fazenda.com', passwordHash, role: 'produtor', createdAt: now, updatedAt: now },
  ]);

  await queryInterface.bulkInsert('Talhoes', [
    // Coordenadas reais de regiões agrícolas (Sorriso/MT e Cascavel/PR).
    { id: 1, nome: 'Talhão Norte', latitude: -12.5453, longitude: -55.7211, areaHectares: 120.5, userId: 2, createdAt: now, updatedAt: now },
    { id: 2, nome: 'Talhão Várzea', latitude: -12.5601, longitude: -55.7008, areaHectares: 84.0, userId: 2, createdAt: now, updatedAt: now },
    { id: 3, nome: 'Talhão Sul', latitude: -24.9555, longitude: -53.4552, areaHectares: 60.0, userId: 3, createdAt: now, updatedAt: now },
  ]);

  await queryInterface.bulkInsert('Safras', [
    { id: 1, cultura: 'Soja', variedade: 'BRS 7980', dataSemeadura: '2025-10-15', produtividadeEstimada: 62, produtividadeReal: 58.4, status: 'colhida', dataColheitaReal: '2026-02-12', talhaoId: 1, createdAt: now, updatedAt: now },
    { id: 2, cultura: 'Milho', variedade: 'AG 8088', dataSemeadura: '2026-02-20', produtividadeEstimada: 170, produtividadeReal: null, status: 'em_andamento', dataColheitaReal: null, talhaoId: 1, createdAt: now, updatedAt: now },
    { id: 3, cultura: 'Trigo', variedade: 'TBIO Toruk', dataSemeadura: '2026-05-01', produtividadeEstimada: 55, produtividadeReal: null, status: 'planejada', dataColheitaReal: null, talhaoId: 3, createdAt: now, updatedAt: now },
  ]);
}

export async function down({ queryInterface }) {
  await queryInterface.bulkDelete('Safras', null, {});
  await queryInterface.bulkDelete('Talhoes', null, {});
  await queryInterface.bulkDelete('Users', null, {});
}
