/* eslint-disable */
module.exports = {
  displayName: 'logging',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': [
      'ts-jest',
      { tsconfig: '<rootDir>/tsconfig.spec.json', isolatedModules: true, diagnostics: false },
    ],
  },
  moduleNameMapper: {
    '^@agent-desktop/types$': '<rootDir>/test-types.ts',
    '^@agent-desktop/(.*)$': '<rootDir>/../../libs/$1/src',
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/libs/logging',
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.spec.ts',
    '!src/**/*.test.ts',
    '!src/index.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
};