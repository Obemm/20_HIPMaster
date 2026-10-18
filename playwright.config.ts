import { defineConfig, devices } from '@playwright/test';

const CI = Boolean(process.env.CI);
// En local : le Chrome déjà installé (aucun navigateur à télécharger). En CI : Chromium installé par Playwright.
const navigateur = CI ? {} : { channel: 'chrome' };

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 1 : 0,
  reporter: CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:4200',
    locale: 'fr-FR',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'mobile', use: { ...devices['Pixel 7'], ...navigateur } },
    { name: 'bureau', use: { ...devices['Desktop Chrome'], ...navigateur } },
  ],
  // L'API puis le front Angular, qui lui relaie /api (proxy.conf.json).
  webServer: [
    {
      command: 'npm start -w @hipmaster/api',
      url: 'http://127.0.0.1:3000/api/v1/sante',
      // Base en mémoire, vierge à chaque lancement (ADR 0018).
      env: { BASE_LOCALE: 'memory://' },
      reuseExistingServer: !CI,
    },
    {
      command: 'npm start -w @hipmaster/web',
      url: 'http://localhost:4200',
      reuseExistingServer: !CI,
      timeout: 180_000,
    },
  ],
});
