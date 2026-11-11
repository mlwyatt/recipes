// Run: yarn lint app -f html -o public/js_errors.html

import brands from '@brandsinsurance/eslint-plugin';
import globals from 'globals';
import { defineConfig, globalIgnores } from 'eslint/config';
// import tsEslint from 'typescript-eslint';

const internalGlobals = Object.fromEntries(
  [
    'esc',
    'label',
  ].map((glob) => [glob, 'readonly']),
);
const ignores = [
  'node_modules/*',
  'public/',
];

export default defineConfig([
  // Global ignore: https://eslint.org/docs/latest/use/configure/ignore#ignoring-files
  globalIgnores(ignores),
  brands.configs.jsGeneric,
  {
    linterOptions: { reportUnusedDisableDirectives: 'warn' },
    languageOptions: {
      globals: {
        ...internalGlobals,
        ...globals.browser,
      },
      ecmaVersion: 2025,
      sourceType: 'script',
    },
  },
  {
    rules: {
      strict: 'off',
      'import/unambiguous': 'off',
      'import/no-unused-modules': 'off',
    },
  },
]);
