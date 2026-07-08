export default {
  testEnvironment: 'node',
  transform: {}, // native ESM, no babel
  testMatch: ['**/tests/**/*.test.js'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testTimeout: 30000,
};
