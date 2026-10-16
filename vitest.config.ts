import { defineConfig } from 'vitest/config';

// Tests unitaires du domaine et de l'API ; le front Angular a son propre lanceur (`ng test`, Vitest aussi).
export default defineConfig({
  test: {
    projects: [
      { test: { name: 'domain', include: ['packages/domain/src/**/*.test.ts'] } },
      { test: { name: 'api', include: ['apps/api/src/**/*.test.ts'] } },
    ],
    coverage: { provider: 'v8', include: ['packages/*/src/**', 'apps/api/src/**'] },
  },
});
