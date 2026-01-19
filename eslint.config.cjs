const { FlatCompat } = require('@eslint/eslintrc');
const compat = new FlatCompat();

module.exports = [
  // 🔥 1. 반드시 최상단에 ignore
  {
    ignores: [
      "**/*",            // 전부 무시
      "!app/**",         // app 만 허용
      "!src/**",         // src 만 허용
      "!public/**",      // public 만 허용

      // 혹시 남아있을 수 있는 RN/Expo 찌꺼기
      "node_modules/**",
      ".expo/**",
      ".expo-shared/**",
      "android/**",
      "ios/**",
      "web-build/**",
      "dist/**",
      "build/**",
      "metro-cache/**",
      "**/*.bundle.js",
      "**/*.min.js",
    ],
  },

  // Expo 기본 규칙
  ...compat.extends("expo"),

  // Import + unused 검사
  {
    files: ["app/**/*.{js,jsx,ts,tsx}", "src/**/*.{js,jsx,ts,tsx}", "public/**/*.{js,jsx,ts,tsx}"],

    plugins: {
      import: require("eslint-plugin-import"),
      "unused-imports": require("eslint-plugin-unused-imports"),
    },

    settings: {
      "import/resolver": {
        alias: {
          map: [["@", "./src"]],
          extensions: [".js", ".jsx", ".ts", ".tsx", ".json"],
        },
      },
    },

    rules: {
      // Import 정확성
      "import/no-unresolved": "error",
      "import/named": "error",
      "import/default": "error",
      "import/no-named-as-default": "warn",
      "import/no-cycle": ["warn", { maxDepth: 1 }],

      // 미사용 코드 제거
      "no-unused-vars": "off",
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
        },
      ],

      // import 정렬
      "import/order": [
        "warn",
        {
          groups: ["builtin", "external", "internal", "parent", "sibling", "index"],
          "newlines-between": "always",
          alphabetize: { order: "asc", caseInsensitive: true },
        },
      ],

      // React-Native / Metro 호환
      "no-undef": "error",
      "no-var": "error",
      "no-unused-expressions": "error",
    },
  },

  // React Native 전역
  {
    languageOptions: {
      globals: {
        URLSearchParams: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        fetch: "readonly",

        // Browser globals
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',

        // Web Crypto / PKCE 관련
        crypto: 'readonly',
        TextEncoder: 'readonly',
        btoa: 'readonly',
      },
    },
  },

  // ESLint 설정 파일 전용
  {
    files: ["eslint.config.cjs"],
    languageOptions: {
      sourceType: "commonjs",
      globals: {
        __dirname: "readonly",
        module: "readonly",
        require: "readonly",
      },
    },
  },
];
