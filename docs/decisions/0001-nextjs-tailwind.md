# 0001 — Next.js + React + Tailwind CSS, TypeScript strict

- **Date** : 2026-10-16
- **Statut** : Acceptée

## Contexte

Un TCG en ligne est une **application** très interactive (ouverture de boosters animée, plateau de jeu, collection
filtrable) avec des comptes et un serveur qui fait autorité (tirages, combats). Il faut l'interface et le serveur
dans le même projet, en TypeScript comme les autres projets.

## Décision

Next.js 16 (App Router, React 19, Server Components et Server Actions), Tailwind CSS 4, TypeScript strict
(`noUncheckedIndexedAccess`), Node 24, npm.

## Alternatives envisagées

- **Astro** (utilisé pour SiteML) : excellent pour des pages de contenu, moins adapté à une application à état riche.
- **Vite + React (SPA) + API séparée** : deux projets à maintenir, plus de code de plomberie.
- **SvelteKit** : très bon, mais écosystème (composants, animation, exemples) plus petit que celui de React.

## Conséquences

- Un seul dépôt pour l'interface, l'API (Server Actions / Route Handlers) et la logique serveur.
- Next.js évolue vite : lire `node_modules/next/dist/docs/` avant d'utiliser une API (voir `AGENTS.md`).
- Déploiement possible sur Vercel ou sur n'importe quel serveur Node / conteneur.
