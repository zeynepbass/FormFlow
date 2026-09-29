import { collection } from '../../database/client.js';
import { generateToken, hashToken } from '../../common/utils/tokens.js';

const TOKEN_TTL = {
  passwordResetTokens: 30 * 60 * 1000,
  emailVerificationTokens: 24 * 60 * 60 * 1000,
};

export async function issueToken(collectionName, userId) {
  const token = generateToken();
  const now = new Date();
  await collection(collectionName).deleteMany({ userId });
  await collection(collectionName).insertOne({
    userId,
    tokenHash: hashToken(token),
    createdAt: now,
    expiresAt: new Date(now.getTime() + TOKEN_TTL[collectionName]),
  });
  return token;
}

export async function consumeToken(collectionName, token) {
  const document = await collection(collectionName).findOneAndDelete({
    tokenHash: hashToken(token),
  });
  if (!document || document.expiresAt <= new Date()) return null;
  return document;
}
