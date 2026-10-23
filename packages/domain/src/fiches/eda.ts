import type { Fiche } from './fiche.ts';

/** Fiches « En savoir plus » de la famille Événementiel (EDA), par numéro de carte (ADR 0034). */
export const FICHES_EDA: Readonly<Record<number, Fiche>> = {
  31: {
    definition:
      'Un réseau de brokers d’événements Solace reliés entre eux : un événement publié d’un côté atteint tous ses abonnés, sur site comme dans le cloud.',
    usage:
      'Diffuser les événements métier en temps réel entre des applications qui ne se connaissent pas : l’éditeur publie sur un topic, le maillage achemine l’événement jusqu’à chaque abonné.',
    exemple:
      'Le système de commandes publie « commande validée » ; la logistique, la facturation et la relation client le reçoivent chacune dans sa file, sans appel direct.',
    aRetenir:
      'Un événement est un contrat : décrire son schéma (AsyncAPI, Event Portal) et le faire évoluer sans casser les abonnés qui existent déjà.',
    chezElis: 'Le maillage d’événements d’Elis.',
    liens: [
      {
        titre: 'Architecture orientée événements',
        url: 'https://fr.wikipedia.org/wiki/Architecture_orient%C3%A9e_%C3%A9v%C3%A9nements',
        langue: 'fr',
      },
      {
        titre: 'What is an Event Mesh?',
        url: 'https://solace.com/what-is-an-event-mesh/',
        langue: 'en',
      },
    ],
  },
};
