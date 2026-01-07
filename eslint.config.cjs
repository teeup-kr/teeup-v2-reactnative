const { FlatCompat } = require('@eslint/eslintrc');
const compat = new FlatCompat();

module.exports = [
  // Expo 기본 규칙
  ...compat.extends('expo'),

  // alias 설정
  {
    plugins: {
      import: require('eslint-plugin-import'),
    },
    settings: {
      'import/resolver': {
        alias: {
          map: [
            ['@', './src'],
          ],
          extensions: ['.js', '.jsx', '.json'],
        },
      },
    },
  },

  // RN 전역 변수
  {
    languageOptions: {
      globals: {
        URLSearchParams: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
      },
    },
  },

  // eslint 설정 파일 전용 Node 전역
  {
    files: ['eslint.config.cjs'],
    languageOptions: {
      globals: {
        __dirname: 'readonly',
      },
    },
  },
];
