// Flat ESLint config for TypeScript (Angular)
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import angularPlugin from '@angular-eslint/eslint-plugin';

export default [
  {
    files: ['src/**/*.ts'],
    ignores: ['dist/', 'out-tsc/', 'node_modules/'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        project: ['tsconfig.json'],
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      '@angular-eslint': angularPlugin,
    },
    rules: {
      // TypeScript rules
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/array-type': ['error', { default: 'generic' }],
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-floating-promises': 'error',

      // General rules
      'max-classes-per-file': ['error', 1],
      'complexity': ['error', 12],
      'max-lines-per-function': ['error', { max: 120 }],
      'no-console': 'error',

      // Angular rules - prefer signals over decorators
      '@angular-eslint/prefer-signals': 'error',
    },
  },
  {
    files: ['src/**/*.service.ts'],
    rules: {
      'max-statements': ['error', { max: 20 }],
    },
  },
  // Logging infrastructure - allow console
  {
    files: [
      'src/app/services/destinations/**/*.ts',
      'src/app/services/core/logging.service.ts',
      'src/app/services/core/log-destination-manager.service.ts',
    ],
    rules: {
      'no-console': 'off',
    },
  },
  // Data files - allow console.warn only
  {
    files: ['src/app/data/**/*.ts'],
    rules: {
      'no-console': ['error', { allow: ['warn'] }],
    },
  },
  // Bootstrap file - allow console.error
  {
    files: ['src/main.ts'],
    rules: {
      'no-console': ['error', { allow: ['error'] }],
    },
  },
];
