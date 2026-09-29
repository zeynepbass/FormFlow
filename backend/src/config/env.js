import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  MONGODB_URI: z.string().min(1),
  AUTH_SECRET: z.string().min(32, 'AUTH_SECRET must be at least 32 characters'),
  CORS_ORIGIN: z.url(),
  APP_URL: z.url(),
  UPLOAD_DIR: z.string().min(1).default('./uploads'),
  TRUST_PROXY: z.coerce.number().int().min(0).default(1),
  REVALIDATE_SECRET: z.string().min(16).optional(),
});

function loadEnv() {
  const result = schema.safeParse(process.env);
  if (!result.success) {
    const issues = result.error.issues.map(
      (issue) => `  ${issue.path.join('.')}: ${issue.message}`,
    );
    process.stderr.write(`Invalid environment variables:\n${issues.join('\n')}\n`);
    process.exit(1);
  }
  return result.data;
}

export const env = loadEnv();
export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';
