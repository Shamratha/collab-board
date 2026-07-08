import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const TOKEN_COOKIE = 'token';

export function signToken(userId) {
  return jwt.sign({ userId: String(userId) }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
}

export function verifyToken(token) {
  return jwt.verify(token, env.jwtSecret);
}
