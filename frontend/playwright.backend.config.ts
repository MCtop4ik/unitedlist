import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: ['backend.spec.ts'],
  fullyParallel: false,
  workers: 1,
  use: { baseURL: 'http://localhost:5173', trace: 'on-first-retry' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    { command: 'npm --prefix .. run e2e:backend', url: 'http://localhost:3001/health', reuseExistingServer: false, timeout: 120000 },
    { command: 'npm run dev', url: 'http://localhost:5173', reuseExistingServer: true },
  ],
});
