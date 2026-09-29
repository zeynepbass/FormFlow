import argon2 from 'argon2';
import { env } from '../../config/env.js';
import { collection } from '../../database/client.js';
import { badRequest, conflict, unauthenticated } from '../../common/errors/app-error.js';
import { mailer } from '../../common/utils/mailer.js';
import { consumeToken, issueToken } from './one-time-tokens.js';
import { createSession, deleteUserSessions } from './session.js';

const users = () => collection('users');

const dummyHash = argon2.hash('formflow-timing-guard');

export function toUserDto(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    emailVerified: Boolean(user.emailVerifiedAt),
    createdAt: user.createdAt,
  };
}

export function hashPassword(password) {
  return argon2.hash(password, { type: argon2.argon2id });
}

export function verifyPassword(hash, password) {
  return argon2.verify(hash, password);
}

async function sendVerificationEmail(user) {
  const token = await issueToken('emailVerificationTokens', user._id);
  const link = new URL(`/verify-email?token=${token}`, env.APP_URL);
  await mailer.send({
    to: user.email,
    subject: 'Confirm your email for FormFlow',
    text: `Hi ${user.name},\n\nConfirm your email address by opening this link:\n${link}\n\nThe link expires in 24 hours.`,
  });
}

export async function register({ name, email, password }) {
  const now = new Date();
  const user = {
    name,
    email,
    passwordHash: await hashPassword(password),
    emailVerifiedAt: null,
    createdAt: now,
    updatedAt: now,
  };

  try {
    const { insertedId } = await users().insertOne(user);
    user._id = insertedId;
  } catch (error) {
    if (error.code === 11000) throw conflict('An account with this email already exists.');
    throw error;
  }

  await sendVerificationEmail(user);
  const session = await createSession(user._id);
  return { user, session };
}

export async function login({ email, password }) {
  const user = await users().findOne({ email });
  const valid = await verifyPassword(user?.passwordHash ?? (await dummyHash), password);

  if (!user || !valid) throw unauthenticated('Email or password is incorrect.');

  const session = await createSession(user._id);
  return { user, session };
}

export async function verifyEmail(token) {
  const record = await consumeToken('emailVerificationTokens', token);
  if (!record) throw badRequest('This verification link is invalid or has expired.');

  await users().updateOne(
    { _id: record.userId, emailVerifiedAt: null },
    { $set: { emailVerifiedAt: new Date(), updatedAt: new Date() } },
  );
}

export async function resendVerification(user) {
  if (user.emailVerifiedAt) return;
  await sendVerificationEmail(user);
}

export async function forgotPassword(email) {
  const user = await users().findOne({ email });
  if (!user) return;

  const token = await issueToken('passwordResetTokens', user._id);
  const link = new URL(`/reset-password?token=${token}`, env.APP_URL);
  await mailer.send({
    to: user.email,
    subject: 'Reset your FormFlow password',
    text: `Hi ${user.name},\n\nReset your password by opening this link:\n${link}\n\nThe link expires in 30 minutes. If you did not ask for this, you can ignore this email.`,
  });
}

export async function resetPassword({ token, password }) {
  const record = await consumeToken('passwordResetTokens', token);
  if (!record) throw badRequest('This reset link is invalid or has expired.');

  await users().updateOne(
    { _id: record.userId },
    { $set: { passwordHash: await hashPassword(password), updatedAt: new Date() } },
  );
  await deleteUserSessions(record.userId);
}
