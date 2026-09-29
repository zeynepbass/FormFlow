import * as z from 'zod/mini';

export const requiredText = (message, max) =>
  z
    .string()
    .check(z.trim(), z.minLength(1, message), z.maxLength(max, `En fazla ${max} karakter kullan.`));
