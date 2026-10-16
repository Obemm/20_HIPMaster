# 0009 — Qualité de code : règles SonarWay et quality gate bloquant

- **Date** : 2026-10-16
- **Statut** : Acceptée
- **Référence Elis** : ADR-039 (SonarCloud V2 : analyse à chaque PR, profil SonarWay, quality gate bloquant),
  ADR-008 (SonarCloud), ADR-040 (Playwright en e2e, Postman en exploratoire)

## Contexte

Elis impose SonarCloud avec le profil SonarWay et un quality gate qui bloque la fusion. Pour un dépôt privé,
SonarQube Cloud est payant ; il est gratuit pour un dépôt public.

## Décision

- **Dès maintenant** : les règles SonarJS (`eslint-plugin-sonarjs`, équivalent local de SonarWay pour TypeScript)
  font partie d'ESLint ; `npm run check` est le **quality gate** : il bloque le commit (Husky) et la PR (CI).
- **Couverture** des tests mesurée (`npm run test:coverage`), objectif 80 % sur `packages/domain`.
- **Le jour où le dépôt est publié sur GitHub** : brancher SonarQube Cloud (profil SonarWay, analyse de chaque PR,
  quality gate obligatoire dans la protection de `main`).
- Tests : Vitest (unitaires), **Playwright** (bout en bout, avec audit d'accessibilité axe-core) ; Postman ou Bruno
  pour l'exploration manuelle de l'API.

## Alternatives envisagées

- **SonarQube Cloud tout de suite en privé** : payant pour un projet personnel.
- **SonarQube Community auto-hébergé** : un serveur à maintenir pour un seul projet.

## Conséquences

- Les mêmes familles de règles qu'un projet Elis (complexité cognitive, duplication, failles courantes) dès le premier commit.
- Écart assumé avec ADR-039 tant que le dépôt est privé : pas de tableau de bord Sonar ni de suivi de dette dans le temps.
