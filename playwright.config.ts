import {defineConfig, devices} from '@playwright/test';

const PORT = 3100;
const BASE_URL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: {
    timeout: 8_000
  },
  outputDir: 'output/playwright/artifacts',
  reporter: [
    ['list'],
    ['html', {open: 'never', outputFolder: 'output/playwright/report'}]
  ],
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off'
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome']
      }
    }
  ],
  webServer: {
    command: `npm run start -- --hostname 127.0.0.1 --port ${PORT}`,
    url: `${BASE_URL}/en`,
    timeout: 120_000,
    reuseExistingServer: !process.env.CI
  }
});
