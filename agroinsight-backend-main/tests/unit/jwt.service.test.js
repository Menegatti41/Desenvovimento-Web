import { describe, expect, it } from 'vitest';
import { signAccessToken, verifyAccessToken } from '../../src/services/jwt.service.js';

describe('jwt.service', () => {
  it('deve assinar e validar token com sub e email', () => {
    const token = signAccessToken({ id: 7, email: 'produtor@agroinsight.com' });
    const payload = verifyAccessToken(token);
    expect(payload.sub).toBe('7');
    expect(payload.email).toBe('produtor@agroinsight.com');
  });

  it('deve lançar erro ao validar token inválido', () => {
    expect(() => verifyAccessToken('token-invalido')).toThrow();
  });
});
