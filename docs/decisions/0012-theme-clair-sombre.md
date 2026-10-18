# 0012 — Thème clair ou sombre selon la préférence du système, par jetons de couleur

- **Date** : 2026-10-18
- **Statut** : Acceptée
- **Référence Elis** : ADR-019 (Figma pour le design d'interface et le design system) — adapté : pas de maquettes
  Figma pour un projet mené seul, mais les couleurs sont organisées en jetons, comme dans un design system

## Contexte

US-009 donne aux cartes un vrai design de carte à jouer, sur le modèle de WikiMasters, qui est en thème sombre. Le
front n'avait qu'un thème clair, avec des couleurs Tailwind écrites en dur (`text-zinc-700`, `bg-white`…) : dans un
navigateur en mode sombre, la page restait blanche, et sans fond explicite certains textes devenaient peu lisibles.

## Décision

- Le front **suit la préférence du système** (`prefers-color-scheme`) : clair par défaut, sombre si l'appareil le
  demande. Pas de bascule dans l'application pour l'instant.
- Les couleurs d'interface passent par des **jetons** : des variables CSS `--hip-*` définies dans
  `apps/web/src/styles.css` pour chaque thème, exposées à Tailwind par `@theme inline` (`bg-fond`, `text-texte`,
  `text-texte-doux`, `border-bordure`, `bg-surface`, `bg-accent`…). Les composants n'écrivent plus de gris en dur.
- Les **cadres de rareté** des cartes ont aussi leurs jetons, déclinés pour chaque thème (`.cadre-commune` à
  `.cadre-legendaire`). Les couleurs vives propres à une famille ou à une statistique utilisent la variante `dark:`
  de Tailwind, qui suit la même préférence du système.
- `color-scheme: light dark` est déclaré, pour que les contrôles natifs (listes déroulantes, barres de défilement)
  suivent le thème.
- Chaque thème doit passer l'audit axe-core (WCAG AA) : les parcours e2e l'exécutent en clair et en sombre.

## Alternatives envisagées

- **Thème sombre uniquement** (comme WikiMasters) : plus proche de la référence, mais impose le sombre à ceux qui lisent
  mieux en clair, et contredit l'usage établi du thème clair sur le poste de travail.
- **Bascule manuelle dans l'application** : utile plus tard, mais demande de mémoriser un choix ; les jetons la rendront
  simple à ajouter (une classe sur `<html>` qui redéfinit les variables).
- **Variante `dark:` partout, sans jetons** : double chaque classe de couleur dans tous les gabarits, et rend
  l'ajout d'une bascule bien plus coûteux.

## Conséquences

- Toute nouvelle couleur d'interface se déclare d'abord comme jeton, dans les deux thèmes.
- Les parcours e2e d'accessibilité tournent dans les deux thèmes, ce qui allonge un peu la CI.
- Une bascule manuelle pourra s'ajouter sans toucher aux composants.
