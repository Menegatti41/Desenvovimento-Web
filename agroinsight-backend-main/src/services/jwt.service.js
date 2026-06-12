import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev_secret_change_me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '1h';

export function signAccessToken(user) {
  return jwt.sign(
    { email: user.email },
    JWT_SECRET,
    {
      subject: String(user.id),
      expiresIn: JWT_EXPIRES_IN,
    },
  );
}

export function verifyAccessToken(token) {
  return jwt.verify(token, JWT_SECRET);
}
