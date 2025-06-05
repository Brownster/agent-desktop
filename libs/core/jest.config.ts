// eslint-disable-next-line @typescript-eslint/no-var-requires
const { getJestProjects } = require('@nx/jest');

module.exports = {
  displayName: 'core',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['../../jest.setup.js'],
  // Exclude test fixtures from being treated as test files
  testPathIgnorePatterns: [
    '/node_modules/',
    '/__tests__/modules/',
    '.*/__tests__/.*\\.js$' // Exclude all .js files in __tests__ directories
  ],
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.ts',
    '<rootDir>/src/**/?(*.)(spec|test).ts'
  ],
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      { tsconfig: '<rootDir>/tsconfig.spec.json', diagnostics: false },
    ],
    '^.+\\.js$': [
      'ts-jest',
      { 
        tsconfig: '<rootDir>/tsconfig.spec.json', 
        diagnostics: false
      },
    ],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/libs/core',
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.spec.ts',
    '!src/**/*.test.ts',
    '!src/**/index.ts',
    '!src/__tests__/modules/**/*.js', // Exclude test fixtures from coverage
  ],
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 75,
      lines: 75,
      statements: 75,
    },
  }
};