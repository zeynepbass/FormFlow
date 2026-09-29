import { collection } from '../../database/client.js';
import { unauthenticated } from '../errors/app-error.js';
import {
  SESSION_COOKIE,
  clearSessionCookie,
  findSession,
  setSessionCookie,
} from '../../modules/auth/session.js';

export async function requireAuth(req, res, next) {
  const token = req.cookies?.[SESSION_COOKIE];
  const session = token ? await findSession(token) : null;

  if (!session) {
    if (token) clearSessionCookie(res);
    throw unauthenticated();
  }

  const user = await collection('users').findOne(
    { _id: session.userId },
    { projection: { passwordHash: 0 } },
  );
  if (!user) {
    clearSessionCookie(res);
    throw unauthenticated();
  }

  if (session.refreshed) setSessionCookie(res, token, session.expiresAt);

  req.user = user;
  req.session = session;
  next();
}
