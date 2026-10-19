import { defineConfig, devices } from '@playwright/test';

const CI = Boolean(process.env.CI);
// En local : le Chrome déjà installé (aucun navigateur à télécharger). En CI : Chromium installé par Playwright.
const navigateur = CI ? {} : { channel: 'chrome' };

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  // En local, trois travailleurs : les duels ouvrent deux ou trois navigateurs chacun, et au-delà la mémoire manque
  // (le serveur Angular et le lanceur ont péri d'un « out of memory » à quatre et six, US-042). En CI, la valeur par
  // défaut.
  workers: CI ? undefined : 3,
  forbidOnly: CI,
  retries: CI ? 1 : 0,
  reporter: CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:4200',
    locale: 'fr-FR',
    trace: 'retain-on-failure',
    // Animations réduites, comme pour un joueur qui l'a demandé : le journal de partie s'affiche d'un coup (US-042).
    reducedMotion: 'reduce',
  },
  projects: [
    {
      name: 'mobile',
      use: { ...devices['Pixel 7'], ...navigateur },
      // File d'appariement commune (US-037) : ses parcours ne tournent que sur le profil bureau.
      testIgnore: '**/duel-hasard.spec.ts',
    },
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
