// @ts-check
const { defineConfig, devices } = require('@playwright/test');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const SKIP_WEBSERVER = !!process.env.SKIP_WEBSERVER;

module.exports = defineConfig({
  testDir: './e2e',
  timeout: 30 * 1000,
  expect: {
    timeout: 5 * 1000,
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['list'],
    ['junit', { outputFile: 'e2e/reports/junit-e2e.xml' }],
    ['html', { outputFolder: 'e2e/playwright-report', open: 'never' }],
  ],
  outputDir: 'e2e/test-results',
  use: {
    baseURL: BASE_URL,
    headless: true,
    actionTimeout: 5 * 1000,
    navigationTimeout: 10 * 1000,
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: SKIP_WEBSERVER
    ? undefined
    : {
        command: 'node src/server.js',
        url: BASE_URL,
        reuseExistingServer: true,
        timeout: 30 * 1000,
        stdout: 'pipe',
        stderr: 'pipe',
      },
});
