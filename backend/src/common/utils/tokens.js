import { createHmac, randomBytes } from 'node:crypto';
import { env } from '../../config/env.js';

export function generateToken() {
  return randomBytes(32).toString('base64url');
}

export function hashToken(token) {
  return createHmac('sha256', env.AUTH_SECRET).update(token).digest('hex');
}

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';

export function randomId(length) {
  const bytes = randomBytes(length);
  let id = '';
  for (const byte of bytes) id += ALPHABET[byte % ALPHABET.length];
  return id;
}
