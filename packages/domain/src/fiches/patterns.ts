import type { Fiche } from './fiche.ts';

/** Fiches « En savoir plus » de la famille Patterns, par numéro de carte (ADR 0036). */
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
  54: {
    definition:
      'Un disjoncteur logiciel : après trop d’échecs vers un service, on cesse de l’appeler pendant un temps, en échouant tout de suite, puis on vérifie prudemment s’il est revenu.',
    usage:
      'Empêcher qu’une panne se propage : ne pas épuiser ses propres ressources (connexions, threads) à attendre un service à terre, et le laisser se rétablir.',
    exemple:
      'Le service de tarification ne répond plus : après 5 échecs, le circuit s’ouvre ; pendant 30 secondes, le site affiche le dernier prix connu, puis un appel d’essai vérifie si le service est revenu.',
    aRetenir:
      'Prévoir quoi faire quand le circuit est ouvert (valeur par défaut, message clair, mise en file), et surveiller son état : un disjoncteur souvent ouvert signale un vrai problème.',
    liens: [
      {
        titre: 'Modèle Circuit Breaker (Microsoft Learn)',
        url: 'https://learn.microsoft.com/fr-fr/azure/architecture/patterns/circuit-breaker',
        langue: 'fr',
      },
      {
        titre: 'Circuit Breaker (Martin Fowler)',
        url: 'https://martinfowler.com/bliki/CircuitBreaker.html',
        langue: 'en',
      },
    ],
  },
  55: {
    definition:
      'Un pattern des Enterprise Integration Patterns : un composant lit le contenu d’un message et l’envoie vers la bonne destination selon des règles.',
    usage:
      'Diriger chaque message vers le système qui sait le traiter, sans que l’émetteur ait à connaître ces systèmes : par pays, par type de produit, par montant.',
    exemple:
      'Les commandes de France vont vers l’ERP français, celles d’Allemagne vers l’ERP allemand, et toutes les autres vers une file à examiner.',
    aRetenir:
      'Toujours prévoir une destination par défaut pour les messages qu’aucune règle ne reconnaît, et garder des règles simples : un routeur ne doit pas devenir un moteur de règles métier.',
    liens: [
      {
        titre: 'Content-Based Router (Enterprise Integration Patterns)',
        url: 'https://www.enterpriseintegrationpatterns.com/patterns/messaging/ContentBasedRouter.html',
        langue: 'en',
      },
    ],
  },
  56: {
    definition:
      'Un pattern des Enterprise Integration Patterns : découper un message composé de plusieurs éléments en autant de messages, pour les traiter un par un.',
    usage:
      'Traiter chaque ligne d’une commande ou chaque enregistrement d’un fichier séparément, en parallèle, et isoler les erreurs à l’élément fautif.',
    exemple:
      'Un fichier de 500 factures devient 500 messages : une facture invalide part en erreur, les 499 autres passent. Un Aggregator peut ensuite recomposer le lot.',
    aRetenir:
      'Garder dans chaque message l’identifiant du lot et sa position (« 3 sur 500 ») : sans eux, impossible de recomposer le lot, de suivre son avancement ou de savoir s’il est complet.',
    liens: [
      {
        titre: 'Splitter (Enterprise Integration Patterns)',
        url: 'https://www.enterpriseintegrationpatterns.com/patterns/messaging/Sequencer.html',
        langue: 'en',
      },
      {
        titre: 'Aggregator (Enterprise Integration Patterns)',
        url: 'https://www.enterpriseintegrationpatterns.com/patterns/messaging/Aggregator.html',
        langue: 'en',
      },
    ],
  },
  57: {
    definition:
      'Un consommateur qui peut recevoir plusieurs fois le même message sans que le résultat change : le second passage n’a aucun effet de plus.',
    usage:
      'Les messageries garantissent souvent la livraison « au moins une fois » : les doublons sont normaux (rejeu, reprise après panne), et c’est au consommateur de les neutraliser.',
    exemple:
      'Chaque paiement porte un identifiant unique ; avant de créditer un compte, le consommateur vérifie qu’il n’a pas déjà traité cet identifiant. Le doublon est ignoré.',
    aRetenir:
      'Il faut un identifiant stable, fourni par l’émetteur, et noter « déjà traité » dans la même transaction que le traitement : sinon une panne entre les deux recrée le doublon.',
    liens: [
      {
        titre: 'Idempotent Receiver (Enterprise Integration Patterns)',
        url: 'https://www.enterpriseintegrationpatterns.com/patterns/messaging/IdempotentReceiver.html',
        langue: 'en',
      },
      {
        titre: 'Idempotent Consumer (microservices.io)',
        url: 'https://microservices.io/patterns/communication-style/idempotent-consumer.html',
        langue: 'en',
      },
    ],
  },
  58: {
    definition:
      'Réessayer une opération qui a échoué pour une raison passagère (réseau coupé, service surchargé, délai dépassé), en espérant qu’elle passe la fois suivante.',
    usage:
      'Absorber sans intervention humaine les erreurs transitoires, inévitables entre systèmes distribués.',
    exemple:
      'Un appel d’API échoue en 503 ; on réessaie après 1 s, puis 2 s, puis 4 s, avec une part de hasard. Au cinquième échec, le message part en Dead Letter Queue.',
    aRetenir:
      'Ne réessayer que les erreurs passagères (pas un 400), limiter le nombre d’essais, les espacer de plus en plus (backoff exponentiel avec gigue), et seulement pour des opérations idempotentes.',
    liens: [
      {
        titre: 'Modèle Retry (Microsoft Learn)',
        url: 'https://learn.microsoft.com/fr-fr/azure/architecture/patterns/retry',
        langue: 'fr',
      },
      {
        titre: 'Exponential Backoff And Jitter (AWS)',
        url: 'https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/',
        langue: 'en',
      },
    ],
  },
};
