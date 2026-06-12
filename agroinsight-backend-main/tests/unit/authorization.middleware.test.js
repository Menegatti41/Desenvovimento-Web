import { describe, expect, it, vi } from 'vitest';
import {
  requireRole,
  requirePermission,
  hasPermission,
} from '../../src/middlewares/authorizationMiddleware.js';

function createRes() {
  return {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; return this; },
  };
}

describe('hasPermission', () => {
  it('admin possui permissão de gerenciar usuários', () => {
    expect(hasPermission('admin', 'users:delete')).toBe(true);
  });
  it('produtor NÃO possui permissão de gerenciar usuários', () => {
    expect(hasPermission('produtor', 'users:delete')).toBe(false);
  });
  it('produtor possui permissão de ler insights', () => {
    expect(hasPermission('produtor', 'insights:read')).toBe(true);
  });
});

describe('requireRole', () => {
  it('bloqueia (403) quando o perfil não está na lista permitida', () => {
    const req = { authUser: { role: 'produtor' } };
    const res = createRes();
    const next = vi.fn();
    requireRole('admin')(req, res, next);
    expect(res.statusCode).toBe(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('libera quando o perfil está na lista permitida', () => {
    const req = { authUser: { role: 'admin' } };
    const res = createRes();
    const next = vi.fn();
    requireRole('admin')(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
  });
});

describe('requirePermission', () => {
  it('bloqueia (403) sem a permissão', () => {
    const req = { authUser: { role: 'produtor' } };
    const res = createRes();
    const next = vi.fn();
    requirePermission('users:delete')(req, res, next);
    expect(res.statusCode).toBe(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('libera com a permissão', () => {
    const req = { authUser: { role: 'produtor' } };
    const res = createRes();
    const next = vi.fn();
    requirePermission('talhoes:create')(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
  });
});
