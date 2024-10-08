module.exports = {
  preset: 'ts-jest',

  testEnvironment: 'jsdom',

  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.jest.json'
    }
  },

  // Test files are .js, .jsx, .ts and .tsx files inside of __tests__ folders and with a suffix of .test or .spec
  testMatch: [ '**/__tests__/**/?(*.)+(spec|test).[jt]s?(x)' ],

  // Included files for test coverage (npm run test:coverage)
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/__tests__/**',
  ],

  // Custom jest matcher
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/utils/toBeWithinRange.ts'],
};
