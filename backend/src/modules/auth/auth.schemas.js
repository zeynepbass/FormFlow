import { z } from 'zod';

export const email = z
  .string()
  .trim()
  .toLowerCase()
  .max(254)
  .pipe(z.email('Enter a valid email address.'));

export const password = z
  .string()
  .min(8, 'Use at least 8 characters.')
  .max(128, 'Use at most 128 characters.');

export const name = z.string().trim().min(1, 'Enter your name.').max(80);

const token = z.string().min(20).max(128);

export const registerSchema = z.object({ name, email, password }).strict();

export const loginSchema = z
  .object({ email, password: z.string().min(1, 'Enter your password.').max(128) })
  .strict();

export const tokenSchema = z.object({ token }).strict();

export const forgotPasswordSchema = z.object({ email }).strict();

export const resetPasswordSchema = z.object({ token, password }).strict();
