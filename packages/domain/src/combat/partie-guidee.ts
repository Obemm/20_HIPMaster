import { deck, type DeckPrete } from './decks.ts';
import type { Action } from './types.ts';

/**
 * La première partie guidée (US-067) : des decks d'initiation fixes contre Stagiaire, et une graine fixe (ADR 0041),
 * pour que la main de départ, les pioches et les coups du bot soient connus d'avance (moteur rejouable, ADR 0013).
 * Chaque étape attend une action précise du joueur ; la partie se poursuit ensuite librement jusqu'à la victoire.
 */

/** Le deck du joueur : des composants simples, qui attaquent vite. */
export const DECK_INITIATION: DeckPrete = {
  id: 'initiation',
  nom: 'Initiation',
  description: 'Le deck de la partie guidée : des composants simples, qui attaquent vite.',
  cartes: deck(
    [4, 2], // Fichier CSV
    [15, 2], // Flow service
    [22, 2], // API REST
    [17, 2], // SOAP / WSDL
    [41, 1], // LLM
    [25, 2], // Webhook
    [16, 2], // Adaptateur JDBC
    [28, 2], // Connecteur SaaS
    [29, 2], // Workflow low-code
    [35, 2], // Pub/Sub
    [20, 1], // OAuth2
  ),
};

/** Le deck du bot : de petits composants, et deux Répertoires de dépôt pour découvrir la Garde. */
export const DECK_INITIATION_BOT: DeckPrete = {
  id: 'initiation-bot',
  nom: 'Initiation (bot)',
  description: 'Le deck du bot de la partie guidée : de petits composants, et la Garde.',
  cartes: deck(
    [8, 2], // Fichier .ok témoin
    [15, 2], // Flow service
    [4, 2], // Fichier CSV
    [7, 2], // Répertoire de dépôt
    [36, 2], // Topic
    [23, 2], // OpenAPI
    [38, 2], // AsyncAPI
    [14, 2], // webMethods Designer
    [6, 2], // Cron
    [5, 2], // Fichier à positions fixes
  ),
};

/** Graine choisie pour que chaque notion arrive dans l'ordre : le joueur commence, le bot pose sa Garde au 2e tour. */
export const GRAINE_PARTIE_GUIDEE = 1262;

/** Le niveau du bot de la partie guidée. */
export const NIVEAU_PARTIE_GUIDEE = 'stagiaire';

/** Une étape : ce que dit la bulle, et l'action attendue (`null` : le joueur joue librement). */
export interface EtapeGuidee {
  titre: string;
  texte: string;
  attendu: Action | null;
}

/**
 * Les étapes, dans l'ordre des actions du joueur : l'étape n attend sa n-ième action (la version de la partie, qui
 * commence à 0 et change à chaque action, ADR 0030). La dernière le laisse jouer jusqu'à la victoire.
 */
export const ETAPES_PARTIE_GUIDEE: readonly EtapeGuidee[] = [
  {
    titre: 'Le Débit paie vos cartes',
    texte:
      'Vous avez 1 Débit (il monte d’un point à chaque tour). Touchez Fichier CSV dans votre main, puis « Poser » : il coûte 1 Débit.',
    attendu: { type: 'poser', carte: 'j1-02' },
  },
  {
    titre: 'Finir son tour',
    texte:
      'Un composant n’attaque pas le tour où il est posé, et votre Débit est épuisé. Touchez « Finir mon tour » : le bot joue le sien.',
    attendu: { type: 'finirTour' },
  },
  {
    titre: 'Attaquer le SI',
    texte:
      'Le but : faire tomber le SLA du SI du bot à 0. Touchez Fichier CSV, puis le SI du bot en haut, et confirmez l’attaque : 2 points de SLA en moins.',
    attendu: { type: 'attaquer', attaquant: 'j1-02', cible: 'si' },
  },
  {
    titre: 'Décommissionner pour du Débit',
    texte:
      'LLM coûte 5 Débit : vous ne la poserez pas avant longtemps. Touchez-la, puis « Décommissionner » : une carte épique rapporte 2 Débit tout de suite (une fois par tour).',
    attendu: { type: 'decommissionner', carte: 'j1-09' },
  },
  {
    titre: 'Deux cartes ce tour-ci',
    texte: 'Vous avez 4 Débit : posez API REST (2 Débit).',
    attendu: { type: 'poser', carte: 'j1-06' },
  },
  {
    titre: 'Deux cartes ce tour-ci',
    texte: 'Et posez Adaptateur JDBC avec les 2 Débit qui restent.',
    attendu: { type: 'poser', carte: 'j1-12' },
  },
  {
    titre: 'Finir son tour',
    texte: 'Vos nouveaux composants attaqueront au prochain tour. Touchez « Finir mon tour ».',
    attendu: { type: 'finirTour' },
  },
  {
    titre: 'La Garde',
    texte:
      'Le bot a posé Répertoire de dépôt, qui a Garde : tant qu’il est en jeu, son SI et ses autres composants sont protégés. Attaquez-le avec API REST.',
    attendu: { type: 'attaquer', attaquant: 'j1-06', cible: 'j2-08' },
  },
  {
    titre: 'La riposte',
    texte:
      'Un composant attaqué riposte : API REST a perdu 1 PV. Achevez Répertoire de dépôt avec Adaptateur JDBC : il lui reste 1 PV, et la riposte ne détruira pas votre JDBC.',
    attendu: { type: 'attaquer', attaquant: 'j1-12', cible: 'j2-08' },
  },
  {
    titre: 'Le SI est à découvert',
    texte: 'La Garde est tombée : attaquez de nouveau le SI du bot avec Fichier CSV.',
    attendu: { type: 'attaquer', attaquant: 'j1-02', cible: 'si' },
  },
  {
    titre: 'Renforcer son plateau',
    texte: 'Posez SOAP / WSDL avec vos 3 Débit : un composant solide, 3 d’attaque et 4 PV.',
    attendu: { type: 'poser', carte: 'j1-07' },
  },
  {
    titre: 'Finir son tour',
    texte: 'Touchez « Finir mon tour ». Ensuite, à vous de jouer !',
    attendu: { type: 'finirTour' },
  },
  {
    titre: 'À vous de jouer',
    texte:
      'Vous connaissez l’essentiel : posez, attaquez le SI, abattez d’abord ce qui a Garde. En cas de doute, l’ampoule en haut de l’écran donne un conseil.',
    attendu: null,
  },
];
