import type { Fiche } from './fiche.ts';

/** Fiches « En savoir plus » de la famille Messagerie & ESB, par numéro de carte (ADR 0034). */
export const FICHES_ESB: Readonly<Record<number, Fiche>> = {
  9: {
    definition:
      'Le serveur d’intégration de la suite webMethods (Software AG, puis IBM depuis 2024) : il exécute les services qui relient les applications entre elles.',
    usage:
      'Recevoir un message, le transformer, appeler une application (ERP, base, service web) et router le résultat. Il joue le rôle d’ESB : le bus central par lequel transitent les échanges.',
    exemple:
      'Une commande arrive en XML ; un flow service la convertit au format de l’ERP, l’envoie par l’adaptateur SAP, puis renvoie un accusé de réception.',
    aRetenir:
      'Un bus central est pratique… jusqu’à devenir le point unique de défaillance et l’endroit où s’accumule la logique métier. Un ESB transforme et route ; les règles du métier vivent dans les applications.',
    chezElis: 'L’ESB historique d’Elis, hébergé sur site ; sa cible est l’iPaaS webMethods.io.',
    liens: [
      {
        titre: 'Enterprise service bus',
        url: 'https://fr.wikipedia.org/wiki/Enterprise_service_bus',
        langue: 'fr',
      },
      { titre: 'webMethods', url: 'https://en.wikipedia.org/wiki/WebMethods', langue: 'en' },
    ],
  },
};
