'use strict';

const js = require('@eslint/js');
const globals = require('globals');
const security = require('eslint-plugin-security');

module.exports = [
{
ignores: [
'node_modules/**',
'coverage/**',
'e2e/reports/**',
'e2e/playwright-report/**',
'e2e/test-results/**',
],
},

js.configs.recommended,

{
  files: ['**/*.js'],

languageOptions: {
  ecmaVersion: 2023,
  sourceType: 'commonjs',
  globals: {
    ...globals.node,
    ...globals.browser,
    ...globals.jest,
  },
},

plugins: {
  security,
},

rules: {
  'no-unused-vars': [
    'error',
    {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
      caughtErrorsIgnorePattern: '^_',
    },
  ],

  'no-empty': ['error', { allowEmptyCatch: true }],

  'security/detect-eval-with-expression': 'warn',
  'security/detect-non-literal-fs-filename': 'warn',
  'security/detect-non-literal-regexp': 'warn',
  'security/detect-object-injection': 'warn',
  'security/detect-unsafe-regex': 'warn',
  'security/detect-child-process': 'warn',
},

},
];
