import { defineConfig } from '@playwright/test';
import base, { serveurApi } from './playwright.config';

// Les mêmes parcours sur le build de production, servi comme par Firebase Hosting (US-050, ADR 0028) : en-têtes de
// firebase.json, CSP stricte comprise, et /api relayé vers l'API. Toute violation de la CSP fait échouer la série
// (e2e/bilan-csp.ts). C'est ce que lance la CI : `npm run test:e2e:production` (build compris).
// Ports à part (API 3100, site 4300), jamais réutilisés : ni les serveurs de développement lancés sur 3000 et 4200,
// ni ceux d'une autre session, et seul ce serveur-ci consigne les violations de la CSP.
const API_PORT = '3100';

export default defineConfig({
  ...base,
  use: { ...base.use, baseURL: 'http://localhost:4300' },
  globalTeardown: './e2e/bilan-csp.ts',
  webServer: [
    {
      ...serveurApi,
      url: `http://127.0.0.1:${API_PORT}/api/v1/sante`,
      env: { ...serveurApi.env, API_PORT },
      reuseExistingServer: false,
    },
    {
      command: 'node e2e/hebergement-local.ts',
      url: 'http://localhost:4300',
      env: { API_PORT },
      reuseExistingServer: false,
    },
  ],
});
