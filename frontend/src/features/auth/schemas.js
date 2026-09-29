import * as z from 'zod/mini';
import { requiredText } from '@/lib/validation';

const email = z.pipe(
  requiredText('Enter your email address.', 254),
  z.email({ error: 'Enter a valid email address.' }),
);

export const newPassword = z
  .string()
  .check(
    z.minLength(8, 'Use at least 8 characters.'),
    z.maxLength(128, 'Use at most 128 characters.'),
  );

export const passwordsMatch = (key) =>
  z.refine((value) => value[key] === value.confirmPassword, {
    error: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

export const loginSchema = z.object({
  email,
  password: z.string().check(z.minLength(1, 'Enter your password.')),
});

export const registerSchema = z.object({
  name: requiredText('Enter your name.', 80),
  email,
  password: newPassword,
});

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z
  .object({ password: newPassword, confirmPassword: z.string() })
  .check(passwordsMatch('password'));
