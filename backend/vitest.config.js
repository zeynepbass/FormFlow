import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globalSetup: ['./tests/setup/global-setup.js'],
    setupFiles: ['./tests/setup/env.js'],
    fileParallelism: false,
    testTimeout: 20000,
    hookTimeout: 60000,
  },
});
