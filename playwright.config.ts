import { defineConfig, devices } from '@playwright/test';

const CI = Boolean(process.env.CI);
const PORT = 3100;
// En local : le Chrome déjà installé (aucun navigateur à télécharger). En CI : Chromium installé par Playwright.
const navigateur = CI ? {} : { channel: 'chrome' };

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 1 : 0,
  reporter: CI ? 'github' : 'list',
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    locale: 'fr-FR',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'mobile', use: { ...devices['Pixel 7'], ...navigateur } },
    { name: 'bureau', use: { ...devices['Desktop Chrome'], ...navigateur } },
  ],
  webServer: {
    command: `npm run build && npx next start -H 127.0.0.1 -p ${PORT}`,
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: !CI,
    timeout: 180_000,
  },
});
