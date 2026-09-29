import { z } from 'zod';

export const email = z
  .string()
  .trim()
  .toLowerCase()
  .max(254)
  .pipe(z.email('Geçerli bir e-posta adresi gir.'));

export const password = z
  .string()
  .min(8, 'En az 8 karakter kullan.')
  .max(128, 'En fazla 128 karakter kullan.');

export const name = z.string().trim().min(1, 'Adını gir.').max(80);

const token = z.string().min(20).max(128);

export const registerSchema = z.object({ name, email, password }).strict();

export const loginSchema = z
  .object({ email, password: z.string().min(1, 'Şifreni gir.').max(128) })
  .strict();

export const tokenSchema = z.object({ token }).strict();

export const forgotPasswordSchema = z.object({ email }).strict();

export const resetPasswordSchema = z.object({ token, password }).strict();
