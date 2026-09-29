import nextVitals from 'eslint-config-next/core-web-vitals';

const config = [
  { ignores: ['.next/', 'coverage/', 'playwright-report/', 'test-results/'] },
  ...nextVitals,
  {
    rules: {
      'no-console': 'error',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
];

export default config;
