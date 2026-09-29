import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:3000';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'node ../backend/scripts/dev-db.js',
      port: 27017,
      reuseExistingServer: true,
      timeout: 120_000,
    },
    {
      command: 'npm run start',
      cwd: '../backend',
      url: 'http://localhost:4000/health',
      reuseExistingServer: true,
      env: {
        NODE_ENV: 'production',
        MONGODB_URI: 'mongodb://127.0.0.1:27017/formflow-e2e',
        AUTH_SECRET: 'e2e-secret-that-is-long-enough-for-hmac-usage',
        CORS_ORIGIN: baseURL,
        APP_URL: baseURL,
        REVALIDATE_SECRET: 'e2e-revalidate-secret',
      },
    },
    {
      command: 'npm run start',
      url: baseURL,
      reuseExistingServer: true,
      env: { REVALIDATE_SECRET: 'e2e-revalidate-secret' },
    },
  ],
});
