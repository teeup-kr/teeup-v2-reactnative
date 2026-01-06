const { FlatCompat } = require('@eslint/eslintrc');
const compat = new FlatCompat({ baseDirectory: __dirname });

module.exports = [
  ...compat.extends('expo'),
  {
    languageOptions: {
      globals: {
        URLSearchParams: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
      },
    },
  },
  {
    files: ['eslint.config.cjs'],
    languageOptions: {
      globals: {
        __dirname: 'readonly',
      },
    },
  },
];
