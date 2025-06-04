/* eslint-disable */
module.exports = {
  displayName: 'assets-api-lambda',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': [
      'ts-jest',
      { tsconfig: '<rootDir>/tsconfig.spec.json', isolatedModules: true },
    ],
  },
  moduleFileExtensions: ['ts', 'js'],
  coverageDirectory: '../../../coverage/infrastructure/assets-api',
  collectCoverageFrom: ['*.ts', '!index.ts'],
};
