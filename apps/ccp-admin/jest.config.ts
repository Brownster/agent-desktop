/* eslint-disable */
module.exports = {
  displayName: 'ccp-admin',
  preset: '../../jest.preset.js',
  transform: {
    '^.+\\.[tj]sx?$': ['babel-jest', { presets: ['@nx/react/babel'] }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  coverageDirectory: '../../coverage/apps/ccp-admin',
  passWithNoTests: true,
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  moduleNameMapper: {
    '^@tanstack/react-query-devtools$': '<rootDir>/src/__mocks__/@tanstack/react-query-devtools.ts',
    '^@aws-sdk/client-dynamodb$': '<rootDir>/src/__mocks__/@aws-sdk/client-dynamodb.ts',
    '^@aws-sdk/lib-dynamodb$': '<rootDir>/src/__mocks__/@aws-sdk/lib-dynamodb.ts',
    '^../config/api\\.config$': '<rootDir>/src/__mocks__/config.ts',
    '^@agent-desktop/(.*)$': '<rootDir>/../../libs/$1/src',
  },
  testEnvironment: 'jsdom',
};