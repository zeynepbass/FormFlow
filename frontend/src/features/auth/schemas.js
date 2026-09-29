import * as z from 'zod/mini';
import { requiredText } from '@/lib/validation';

const email = z.pipe(
  requiredText('E-posta adresini gir.', 254),
  z.email({ error: 'Geçerli bir e-posta adresi gir.' }),
);

export const newPassword = z
  .string()
  .check(
    z.minLength(8, 'En az 8 karakter kullan.'),
    z.maxLength(128, 'En fazla 128 karakter kullan.'),
  );

export const passwordsMatch = (key) =>
  z.refine((value) => value[key] === value.confirmPassword, {
    error: 'Şifreler eşleşmiyor.',
    path: ['confirmPassword'],
  });

export const loginSchema = z.object({
  email,
  password: z.string().check(z.minLength(1, 'Şifreni gir.')),
});

export const registerSchema = z.object({
  name: requiredText('Adını gir.', 80),
  email,
  password: newPassword,
});

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z
  .object({ password: newPassword, confirmPassword: z.string() })
  .check(passwordsMatch('password'));
