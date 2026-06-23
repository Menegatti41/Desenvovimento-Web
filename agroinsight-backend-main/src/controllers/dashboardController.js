import { Talhao, Safra } from '../models/index.js';
import { asyncHandler } from '../middlewares/errorMiddleware.js';
import { Op } from 'sequelize';

export const getDashboardSummary = asyncHandler(async (req, res) => {
  const userId = req.authUser.id;

  // 1. Busca todos os talhões que pertencem a este usuário (trazendo apenas o ID para performance)
  const meusTalhoes = await Talhao.findAll({
    where: { userId },
    attributes: ['id']
  });

  const totalTalhoes = meusTalhoes.length;

  // Extrai os IDs dos talhões em um array simples, ex: [1, 2, 3]
  const talhaoIds = meusTalhoes.map(t => t.id);

  // 2. Conta as safras que pertencem a esses talhões (Evita 100% o bug de JOIN do Sequelize)
  let safrasAtivas = 0;
  
  if (talhaoIds.length > 0) {
    safrasAtivas = await Safra.count({
      where: {
        talhaoId: { [Op.in]: talhaoIds }, // Busca safras associadas aos talhões do usuário
        status: { [Op.in]: ['planejada', 'em_andamento'] } // Filtra pelos status do seu safra.model.js
      }
    });
  }

  // Retorna os dados puros e exatos para o Front-end
  return res.json({
    totalTalhoes,
    safrasAtivas,
    clima: "Bom"
  });
});