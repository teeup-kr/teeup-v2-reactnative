const { FlatCompat } = require('@eslint/eslintrc');
const compat = new FlatCompat();

module.exports = [
  // Expo 기본 규칙
  ...compat.extends('expo'),

  // Import + unused 검사
  {
    plugins: {
      import: require('eslint-plugin-import'),
      'unused-imports': require('eslint-plugin-unused-imports'),
    },

    settings: {
      'import/resolver': {
        alias: {
          map: [['@', './src']],
          extensions: [
            '.js',
            '.jsx',
            '.ts',
            '.tsx',
            '.json',
          ],
        },
      },
    },

    rules: {
      // Import 정확성
      'import/no-unresolved': 'error',
      'import/named': 'error',
      'import/default': 'error',
      'import/no-named-as-default': 'warn',
      'import/no-cycle': ['warn', { maxDepth: 1 }],

      // 미사용 코드 제거
      'no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],

      // 선택: import 정렬
      'import/order': [
        'warn',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
          ],
          'newlines-between': 'always',
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
        },
      ],
    },
  },

  // React Native 전역
  {
    languageOptions: {
      globals: {
        URLSearchParams: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        fetch: 'readonly',
      },
    },
  },

  // ESLint 설정 파일 전용
  {
    files: ['eslint.config.cjs'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: {
        __dirname: 'readonly',
        module: 'readonly',
        require: 'readonly',
      },
    },
  },
];
