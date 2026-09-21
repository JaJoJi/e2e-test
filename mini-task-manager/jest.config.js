'use strict';

/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: ['<rootDir>/tests/**/*.test.js'],
  // Do not run Playwright specs under Jest.
  testPathIgnorePatterns: ['/node_modules/', '/e2e/'],
  // JUnit XML for the Jenkins "Unit Test" stage (junit plugin).
  reporters: [
    'default',
    ['jest-junit', { outputFile: 'test-results/junit-unit.xml' }],
  ],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/public/**',
    '!src/**/*.test.js',
  ],
  coverageDirectory: 'coverage',
  // text  -> stdout summary
  // lcov  -> coverage/lcov.info            (SonarQube)
  // cobertura -> coverage/cobertura-coverage.xml  (Jenkins Cobertura plugin)
  coverageReporters: ['text', 'lcov', 'cobertura'],
  // Keep coverage report numbers sane in this small project.
  coverageThreshold: {
    global: {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0,
    },
  },
  clearMocks: true,
  verbose: false,
};
