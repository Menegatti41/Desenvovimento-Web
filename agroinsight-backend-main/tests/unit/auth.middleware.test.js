import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/services/jwt.service.js', () => ({
  verifyAccessToken: vi.fn(),
}));
vi.mock('../../src/models/index.js', () => ({
  User: { findByPk: vi.fn() },
}));

import { verifyAccessToken } from '../../src/services/jwt.service.js';
import { User } from '../../src/models/index.js';
import { requireAuth } from '../../src/middlewares/authMiddleware.js';

function createRes() {
  return {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; return this; },
  };
}

describe('authMiddleware.requireAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve retornar 401 sem header Authorization', async () => {
    const req = { headers: {} };
    const res = createRes();
    const next = vi.fn();
    await requireAuth(req, res, next);
    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('deve retornar 401 para token inválido', async () => {
    verifyAccessToken.mockImplementation(() => { throw new Error('invalid'); });
    const req = { headers: { authorization: 'Bearer token-invalido' } };
    const res = createRes();
    const next = vi.fn();
    await requireAuth(req, res, next);
    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('deve retornar 401 quando o usuário do token não existe', async () => {
    verifyAccessToken.mockReturnValue({ sub: '99' });
    User.findByPk.mockResolvedValue(null);
    const req = { headers: { authorization: 'Bearer token-ok' } };
    const res = createRes();
    const next = vi.fn();
    await requireAuth(req, res, next);
    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('deve chamar next e injetar authUser (com role) quando válido', async () => {
    verifyAccessToken.mockReturnValue({ sub: '1' });
    User.findByPk.mockResolvedValue({ id: 1, email: 'user@mail.com', name: 'User', role: 'produtor' });
    const req = { headers: { authorization: 'Bearer token-ok' } };
    const res = createRes();
    const next = vi.fn();
    await requireAuth(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(req.authUser).toEqual({ id: 1, email: 'user@mail.com', name: 'User', role: 'produtor' });
  });
});
