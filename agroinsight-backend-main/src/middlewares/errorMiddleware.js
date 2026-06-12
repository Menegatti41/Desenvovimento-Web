// Utilitários de tratamento de erros para o Express.

// Envolve handlers async para que rejeições caiam no error handler central
// sem precisar de try/catch em cada controller.
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// 404 para rotas não mapeadas.
export const notFoundHandler = (req, res) => {
  res.status(404).json({ message: `Rota não encontrada: ${req.method} ${req.originalUrl}` });
};

// Handler central de erros (precisa dos 4 parâmetros para o Express reconhecê-lo).
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  // Erros de validação do Sequelize viram 400.
  if (err?.name === 'SequelizeValidationError' || err?.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json({
      message: 'Erro de validação',
      detalhes: err.errors?.map((e) => e.message) ?? [err.message],
    });
  }

  console.error('[error]', err);
  return res.status(err?.status ?? 500).json({
    message: err?.expose ? err.message : 'Erro interno do servidor',
  });
};
