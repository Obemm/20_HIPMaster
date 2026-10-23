import type { Fiche } from './fiche.ts';

/** Fiches « En savoir plus » de la famille Patterns, par numéro de carte (ADR 0034). */
export const FICHES_PATTERNS: Readonly<Record<number, Fiche>> = {
  53: {
    definition:
      'La file où l’on range les messages qui n’ont pas pu être traités, au lieu de les perdre ou de bloquer la file principale. C’est le « Dead Letter Channel » des Enterprise Integration Patterns.',
    usage:
      'Isoler un message en échec (format invalide, trop de tentatives, délai expiré) pour que le flux continue, puis l’analyser, le corriger et le rejouer.',
    exemple:
      'Une commande mal formée échoue trois fois : le broker la déplace dans la DLQ. Le lendemain, on corrige le mapping et on rejoue la file.',
    aRetenir:
      'Une DLQ que personne ne surveille n’est qu’une poubelle : alerter dès qu’elle se remplit, et prévoir comment rejouer sans créer de doublons.',
    liens: [
      {
        titre: 'Dead Letter Channel (Enterprise Integration Patterns)',
        url: 'https://www.enterpriseintegrationpatterns.com/patterns/messaging/DeadLetterChannel.html',
        langue: 'en',
      },
      {
        titre: 'Dead letter queue',
        url: 'https://en.wikipedia.org/wiki/Dead_letter_queue',
        langue: 'en',
      },
    ],
  },
};
