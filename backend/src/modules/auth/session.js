import { isProduction } from '../../config/env.js';
import { collection } from '../../database/client.js';
import { generateToken, hashToken } from '../../common/utils/tokens.js';

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const IDLE_TIMEOUT = 7 * DAY;
const ABSOLUTE_TIMEOUT = 30 * DAY;
const TOUCH_INTERVAL = HOUR;

export const SESSION_COOKIE = isProduction ? '__Host-formflow_session' : 'formflow_session';

const sessions = () => collection('sessions');

export async function createSession(userId) {
  const token = generateToken();
  const now = new Date();
  const session = {
    userId,
    tokenHash: hashToken(token),
    createdAt: now,
    lastSeenAt: now,
    expiresAt: new Date(now.getTime() + IDLE_TIMEOUT),
    absoluteExpiresAt: new Date(now.getTime() + ABSOLUTE_TIMEOUT),
  };
  const { insertedId } = await sessions().insertOne(session);
  return { token, session: { _id: insertedId, ...session } };
}

export async function findSession(token) {
  if (typeof token !== 'string' || token.length === 0 || token.length > 128) return null;

  const now = new Date();
  const session = await sessions().findOne({
    tokenHash: hashToken(token),
    expiresAt: { $gt: now },
  });
  if (!session) return null;

  if (now - session.lastSeenAt > TOUCH_INTERVAL) {
    const expiresAt = new Date(
      Math.min(now.getTime() + IDLE_TIMEOUT, session.absoluteExpiresAt.getTime()),
    );
    await sessions().updateOne({ _id: session._id }, { $set: { lastSeenAt: now, expiresAt } });
    return { ...session, lastSeenAt: now, expiresAt, refreshed: true };
  }

  return session;
}

export async function deleteSession(token) {
  if (typeof token !== 'string') return;
  await sessions().deleteOne({ tokenHash: hashToken(token) });
}

export async function deleteUserSessions(userId) {
  await sessions().deleteMany({ userId });
}

export function setSessionCookie(res, token, expiresAt) {
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  });
}

export function clearSessionCookie(res) {
  res.clearCookie(SESSION_COOKIE, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
  });
}
