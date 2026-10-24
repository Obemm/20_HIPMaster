import { LANGUE_REFERENCE, type Langue } from '../langues/textes.ts';
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

/**
 * Les bulles en anglais (US-081), dans le même ordre que `ETAPES_PARTIE_GUIDEE` : seuls le titre et le texte
 * changent, l'action attendue reste celle de l'étape française.
 */
const BULLES_EN: readonly Pick<EtapeGuidee, 'titre' | 'texte'>[] = [
  {
    titre: 'Throughput pays for your cards',
    texte:
      'You have 1 Throughput (it goes up by one each turn). Tap CSV file in your hand, then “Deploy”: it costs 1 Throughput.',
  },
  {
    titre: 'Ending your turn',
    texte:
      'A component can’t attack on the turn it is deployed, and your Throughput is spent. Tap “End my turn”: the bot plays its own.',
  },
  {
    titre: 'Attacking the System',
    texte:
      'The goal: bring the SLA of the bot’s System down to 0. Tap CSV file, then the bot’s System at the top, and confirm the attack: 2 SLA points off.',
  },
  {
    titre: 'Decommissioning for Throughput',
    texte:
      'LLM costs 5 Throughput: you won’t deploy it for a long while. Tap it, then “Decommission”: an epic card gives you 2 Throughput right away (once per turn).',
  },
  {
    titre: 'Two cards this turn',
    texte: 'You have 4 Throughput: deploy REST API (2 Throughput).',
  },
  {
    titre: 'Two cards this turn',
    texte: 'And deploy JDBC Adapter with the 2 Throughput left.',
  },
  {
    titre: 'Ending your turn',
    texte: 'Your new components will attack next turn. Tap “End my turn”.',
  },
  {
    titre: 'Guard',
    texte:
      'The bot has deployed Drop folder, which has Guard: while it is in play, its System and its other components are protected. Attack it with REST API.',
  },
  {
    titre: 'The counter-attack',
    texte:
      'An attacked component counter-attacks: REST API lost 1 HP. Finish off Drop folder with JDBC Adapter: it has 1 HP left, and the counter-attack won’t destroy your JDBC.',
  },
  {
    titre: 'The System is exposed',
    texte: 'Guard is down: attack the bot’s System again with CSV file.',
  },
  {
    titre: 'Strengthening your board',
    texte: 'Deploy SOAP / WSDL with your 3 Throughput: a solid component, 3 attack and 4 HP.',
  },
  {
    titre: 'Ending your turn',
    texte: 'Tap “End my turn”. Then it’s your turn to play!',
  },
  {
    titre: 'Over to you',
    texte:
      'You know the essentials: deploy, attack the System, take down whatever has Guard first. If in doubt, the light bulb at the top of the screen gives a hint.',
  },
];

/** Les étapes de la partie guidée, bulles dans la langue du joueur (US-081). */
export function etapesPartieGuidee(langue: Langue = LANGUE_REFERENCE): readonly EtapeGuidee[] {
  if (langue === 'fr') return ETAPES_PARTIE_GUIDEE;
  return ETAPES_PARTIE_GUIDEE.map((etape, i) => ({ ...etape, ...BULLES_EN[i] }));
}
