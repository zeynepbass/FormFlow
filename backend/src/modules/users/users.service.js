import { collection } from '../../database/client.js';
import { badRequest } from '../../common/errors/app-error.js';
import { hashPassword, verifyPassword } from '../auth/auth.service.js';
import { createSession, deleteUserSessions } from '../auth/session.js';
import { deleteForm } from '../forms/forms.service.js';

const users = () => collection('users');

export async function updateProfile(userId, { name }) {
  return users().findOneAndUpdate(
    { _id: userId },
    { $set: { name, updatedAt: new Date() } },
    { returnDocument: 'after', projection: { passwordHash: 0 } },
  );
}

async function assertPassword(userId, password) {
  const user = await users().findOne({ _id: userId }, { projection: { passwordHash: 1 } });
  if (!user || !(await verifyPassword(user.passwordHash, password))) {
    throw badRequest('Mevcut şifren hatalı.', [
      { path: 'currentPassword', message: 'Mevcut şifren hatalı.' },
    ]);
  }
}

export async function changePassword(userId, { currentPassword, newPassword }) {
  await assertPassword(userId, currentPassword);
  await users().updateOne(
    { _id: userId },
    { $set: { passwordHash: await hashPassword(newPassword), updatedAt: new Date() } },
  );
  await deleteUserSessions(userId);
  return createSession(userId);
}

export async function deleteAccount(userId, { password }) {
  await assertPassword(userId, password);

  const forms = await collection('forms')
    .find({ ownerId: userId }, { projection: { _id: 1 } })
    .toArray();
  for (const form of forms) await deleteForm(userId, form._id);

  await Promise.all([
    deleteUserSessions(userId),
    collection('passwordResetTokens').deleteMany({ userId }),
    collection('emailVerificationTokens').deleteMany({ userId }),
  ]);
  await users().deleteOne({ _id: userId });
}
