import { User } from '../models/index.js';
import { verifyAccessToken } from '../services/jwt.service.js';

// Valida o token JWT do header Authorization e injeta req.authUser.
// IMPORTANTE: o `role` é lido do banco (não do token) — assim uma mudança de
// perfil tem efeito imediato e o middleware de autorização tem acesso a ele.
export const requireAuth = async (req, res, next) => {
  const header = req.headers.authorization ?? '';
  const [type, token] = header.split(' ');

  if (type !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'Token ausente ou inválido' });
  }

  try {
    const payload = verifyAccessToken(token);
    const userId = Number.parseInt(payload.sub, 10);
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(401).json({ message: 'Usuário do token não encontrado' });
    }

    req.authUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
    return next();
  } catch {
    return res.status(401).json({ message: 'Token inválido ou expirado' });
  }
};
