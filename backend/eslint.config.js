import js from '@eslint/js';
import n from 'eslint-plugin-n';
import globals from 'globals';

export default [
  { ignores: ['coverage/', 'uploads/'] },
  js.configs.recommended,
  n.configs['flat/recommended-module'],
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.node,
    },
    rules: {
      'no-console': 'error',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'n/no-process-exit': 'off',
      'n/no-unpublished-import': 'off',
    },
  },
];
