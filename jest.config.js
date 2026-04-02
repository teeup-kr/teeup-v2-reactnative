module.exports = {
  preset: 'jest-expo',
  testMatch: ['**/__tests__/**/*.(spec|test).[jt]s?(x)'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  silent: true,
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^expo-constants$': '<rootDir>/__mocks__/expo-constants.js',
    '^@/lib/util/authUtils$':
      '<rootDir>/__mocks__/@/lib/util/authUtils.js'
  },
};
