/* eslint-disable */
module.exports = {
  displayName: 'ccp-client',
  preset: '../../jest.preset.js',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['../../jest.setup.js'],
  transform: {
    '^.+\\.[tj]sx?$': ['babel-jest', { presets: ['@nx/react/babel'] }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  coverageDirectory: '../../coverage/apps/ccp-client',
  passWithNoTests: true,
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^amazon-connect-rtc-js$': '<rootDir>/src/__mocks__/amazon-connect-rtc-js.ts',
  },
};