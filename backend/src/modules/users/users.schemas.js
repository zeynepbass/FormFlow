import { z } from 'zod';
import { name, password } from '../auth/auth.schemas.js';

export const updateProfileSchema = z.object({ name }).strict();

export const changePasswordSchema = z
  .object({ currentPassword: z.string().min(1).max(128), newPassword: password })
  .strict();

export const deleteAccountSchema = z.object({ password: z.string().min(1).max(128) }).strict();
