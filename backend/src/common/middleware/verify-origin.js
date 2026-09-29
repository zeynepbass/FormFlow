import { env } from '../../config/env.js';
import { forbidden } from '../errors/app-error.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export function verifyOrigin(req, res, next) {
  if (SAFE_METHODS.has(req.method)) return next();

  const origin = req.get('origin');
  if (origin && origin !== env.CORS_ORIGIN)
    return next(forbidden('Siteler arası istek engellendi.'));

  if (req.get('sec-fetch-site') === 'cross-site') {
    return next(forbidden('Siteler arası istek engellendi.'));
  }

  next();
}
