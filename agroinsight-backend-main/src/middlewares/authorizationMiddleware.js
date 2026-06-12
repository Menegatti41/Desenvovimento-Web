// Autorização baseada em perfis (RBAC).
//
// Mapa de permissões por role:
//   admin    -> gestão completa de usuários, talhões, safras e insights.
//   produtor -> gerencia seus PRÓPRIOS talhões/safras e lê insights.
//               (a checagem de propriedade é feita nos controllers)
export const ROLE_PERMISSIONS = {
  admin: [
    'users:read', 'users:update', 'users:delete',
    'talhoes:read', 'talhoes:create', 'talhoes:update', 'talhoes:delete',
    'safras:read', 'safras:create', 'safras:update', 'safras:delete',
    'insights:read',
  ],
  produtor: [
    'talhoes:read', 'talhoes:create', 'talhoes:update', 'talhoes:delete',
    'safras:read', 'safras:create', 'safras:update', 'safras:delete',
    'insights:read',
  ],
};

export function hasPermission(role, permission) {
  const perms = ROLE_PERMISSIONS[role] ?? [];
  return perms.includes(permission);
}

export const requireRole = (...allowedRoles) => (req, res, next) => {
  const userRole = req.authUser?.role;
  if (!userRole || !allowedRoles.includes(userRole)) {
    return res.status(403).json({ message: 'Acesso negado para este perfil' });
  }
  return next();
};

export const requirePermission = (permission) => (req, res, next) => {
  const userRole = req.authUser?.role;
  if (!userRole || !hasPermission(userRole, permission)) {
    return res.status(403).json({ message: 'Permissão insuficiente para este recurso' });
  }
  return next();
};
