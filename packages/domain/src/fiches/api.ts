import type { Fiche } from './fiche.ts';

/** Fiches « En savoir plus » de la famille API, par numéro de carte (ADR 0036). */
export const FICHES_API: Readonly<Record<number, Fiche>> = {
  18: {
    definition:
      'La passerelle d’API de Google Cloud : un point d’entrée unique, placé devant les API, pour les sécuriser, en limiter l’usage et les mesurer.',
    usage:
      'Chaque appel passe par un proxy qui vérifie l’identité du consommateur (clé d’API, jeton OAuth2), applique les quotas, transforme la requête si besoin, la relaie au service réel et en garde les statistiques.',
    exemple:
      'Une application mobile appelle /commandes : Apigee contrôle son jeton, refuse la requête de trop dans la minute, puis transmet les autres au service interne.',
    aRetenir:
      'La passerelle protège et observe ; elle ne porte pas la logique métier. Un proxy bourré de règles devient un petit ESB, difficile à maintenir.',
    chezElis: 'La passerelle API d’Elis : le point d’entrée unique de ses API.',
    liens: [
      {
        titre: 'Qu’est-ce qu’Apigee ?',
        url: 'https://docs.cloud.google.com/apigee/docs/api-platform/get-started/what-apigee?hl=fr',
        langue: 'fr',
      },
      {
        titre: 'API management',
        url: 'https://en.wikipedia.org/wiki/API_management',
        langue: 'en',
      },
    ],
  },
};
