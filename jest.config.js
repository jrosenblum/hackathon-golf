const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    // Handle module aliases (this will be automatically configured for you soon)
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!**/node_modules/**',
  ],
  // Temporarily disable coverage thresholds while developing tests
  // coverageThreshold: {
  //   global: {
  //     statements: 70,
  //     branches: 70,
  //     functions: 70,
  //     lines: 70,
  //   },
  // },
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);