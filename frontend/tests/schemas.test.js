import { describe, expect, it } from 'vitest';
import { loginSchema, registerSchema, resetPasswordSchema } from '@/features/auth/schemas';

const messages = (schema, value) => {
  const result = schema.safeParse(value);
  return result.success
    ? {}
    : Object.fromEntries(result.error.issues.map((i) => [i.path.join('.'), i.message]));
};

describe('auth schemas', () => {
  it('trims and validates registration input', () => {
    const result = registerSchema.safeParse({
      name: '  Ada ',
      email: ' ada@example.com ',
      password: 'long enough',
    });
    expect(result.data).toEqual({ name: 'Ada', email: 'ada@example.com', password: 'long enough' });
    expect(messages(registerSchema, { name: ' ', email: 'x', password: 'short' })).toEqual({
      name: 'Enter your name.',
      email: 'Enter a valid email address.',
      password: 'Use at least 8 characters.',
    });
  });

  it('requires both login fields', () => {
    expect(messages(loginSchema, { email: '', password: '' })).toEqual({
      email: 'Enter your email address.',
      password: 'Enter your password.',
    });
  });

  it('reports mismatched passwords on the confirmation field', () => {
    expect(
      messages(resetPasswordSchema, { password: 'long enough', confirmPassword: 'different' }),
    ).toEqual({
      confirmPassword: 'Passwords do not match.',
    });
  });
});
