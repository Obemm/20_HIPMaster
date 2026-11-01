import js from '@eslint/js';
import angular from 'angular-eslint';
import prettier from 'eslint-config-prettier';
import sonarjs from 'eslint-plugin-sonarjs';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig([
  globalIgnores([
    '**/node_modules/',
    '**/dist/',
    '**/coverage/',
    '**/.angular/',
    'apps/api/drizzle/',
    'playwright-report/',
    'test-results/',
    // Worktrees Git créés par l'app Claude Desktop : une copie du dépôt, pas notre code (US-044).
    '.claude/worktrees/',
  ]),
  {
    files: ['**/*.{js,ts}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      // Équivalent local du profil SonarWay (ADR 0009).
      sonarjs.configs.recommended,
    ],
    languageOptions: { globals: { ...globals.node } },
  },
  {
    files: ['apps/web/**/*.ts'],
    extends: [angular.configs.tsRecommended],
    processor: angular.processInlineTemplates,
    languageOptions: { globals: { ...globals.browser } },
    rules: {
      '@angular-eslint/component-selector': [
        'error',
        { type: 'element', prefix: 'hip', style: 'kebab-case' },
      ],
      '@angular-eslint/directive-selector': [
        'error',
        { type: 'attribute', prefix: 'hip', style: 'camelCase' },
      ],
    },
  },
  {
    // Page d'accueil du site, qui choisit la langue (US-079) : un script de navigateur, hors d'Angular.
    files: ['apps/web/racine/*.js'],
    languageOptions: { globals: { ...globals.browser } },
  },
  {
    files: ['apps/web/**/*.html'],
    extends: [angular.configs.templateRecommended, angular.configs.templateAccessibility],
  },
  {
    // Aucun texte d'interface en dur (US-080, ADR 0042) : tout texte et tout attribut lu par le joueur porte `i18n`.
    // Les attributs techniques (identifiants, classes, SVG…) n'ont rien à traduire.
    // index.html est traduit à part, par la coquille de chaque langue (scripts/langues/assembler-site.ts).
    files: ['apps/web/src/app/**/*.html'],
    ignores: ['**/*.spec.ts/**'],
    rules: {
      '@angular-eslint/template/i18n': [
        'error',
        {
          checkId: false,
          ignoreAttributes: [
            'aria-labelledby',
            'aria-describedby',
            'aria-controls',
            'aria-haspopup',
            'aria-live',
            'ariaCurrentWhenActive',
            'decoding',
            'inputmode',
            'loading',
            'rel',
            'mode',
            'nom',
            'stroke-linecap',
            'stroke-linejoin',
            'quoi',
            'scope',
            'autocapitalize',
          ],
        },
      ],
    },
  },
  prettier,
]);
