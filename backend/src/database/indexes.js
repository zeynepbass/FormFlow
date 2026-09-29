import { getDb } from './client.js';

const ANALYTICS_RETENTION_SECONDS = 60 * 60 * 24 * 180;

export async function ensureIndexes() {
  const db = getDb();

  await Promise.all([
    db.collection('users').createIndex({ email: 1 }, { unique: true }),

    db.collection('sessions').createIndex({ tokenHash: 1 }, { unique: true }),
    db.collection('sessions').createIndex({ userId: 1 }),
    db.collection('sessions').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),

    db.collection('forms').createIndex({ slug: 1 }, { unique: true }),
    db.collection('forms').createIndex({ ownerId: 1, updatedAt: -1 }),

    db.collection('responses').createIndex({ formId: 1, createdAt: -1, _id: -1 }),
    db
      .collection('responses')
      .createIndex({ formId: 1, searchText: 'text' }, { default_language: 'none' }),

    db.collection('analyticsEvents').createIndex({ formId: 1, createdAt: 1 }),
    db
      .collection('analyticsEvents')
      .createIndex(
        { formId: 1, visitorId: 1, type: 1 },
        { unique: true, partialFilterExpression: { type: { $in: ['view', 'start'] } } },
      ),
    db
      .collection('analyticsEvents')
      .createIndex({ createdAt: 1 }, { expireAfterSeconds: ANALYTICS_RETENTION_SECONDS }),

    ...['passwordResetTokens', 'emailVerificationTokens'].flatMap((name) => [
      db.collection(name).createIndex({ tokenHash: 1 }, { unique: true }),
      db.collection(name).createIndex({ userId: 1 }),
      db.collection(name).createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    ]),
  ]);
}
