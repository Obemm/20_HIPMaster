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
  32: {
    definition:
      'L’outil de Solace pour concevoir, cataloguer et gouverner les événements : lesquels existent, leurs schémas, leurs topics, qui les publie et qui s’y abonne.',
    usage:
      'Trouver les événements disponibles avant d’en créer, concevoir les applications événementielles, versionner les schémas et exporter leurs contrats AsyncAPI.',
    exemple:
      'Une équipe cherche « commande » dans l’Event Portal, trouve l’événement « commande validée », son schéma et son topic, et y abonne son application.',
    aRetenir:
      'Un catalogue ne vaut que s’il reflète la réalité : documenter chaque événement dès sa création, et comparer de temps en temps le catalogue à ce que les brokers transportent vraiment.',
    liens: [
      {
        titre: 'Solace Event Portal',
        url: 'https://solace.com/products/event-portal/',
        langue: 'en',
      },
      {
        titre: 'Documentation de l’Event Portal',
        url: 'https://docs.solace.com/Cloud/Event-Portal/event-portal-lp.htm',
        langue: 'en',
      },
    ],
  },
  33: {
    definition:
      'Le logiciel qui reçoit les événements des éditeurs, les garde au besoin, et les distribue aux abonnés : l’intermédiaire de l’architecture événementielle.',
    usage:
      'Découpler éditeurs et abonnés, qui ne connaissent que le broker : il route selon les topics, met en file pour les abonnés absents et absorbe les pics de charge.',
    exemple:
      'La caisse publie « vente enregistrée » ; le stock et la comptabilité la reçoivent, même si la comptabilité était arrêtée au moment de la vente.',
    aRetenir:
      'Le broker devient une pièce critique : le redonder, surveiller ses files et ses connexions, et choisir pour chaque flux entre livraison garantie et livraison « au mieux ».',
    liens: [
      {
        titre: 'What is an Event Broker?',
        url: 'https://solace.com/what-is-an-event-broker/',
        langue: 'en',
      },
      {
        titre: 'Agent de messages',
        url: 'https://fr.wikipedia.org/wiki/Agent_de_messages',
        langue: 'fr',
      },
    ],
  },
  34: {
    definition:
      'Change Data Capture : détecter les insertions, modifications et suppressions dans une base, le plus souvent en lisant son journal de transactions, et les publier comme événements.',
    usage:
      'Faire d’une application qui ne publie rien une source d’événements, sans toucher à son code ; alimenter caches, entrepôts de données ou autres applications presque en temps réel.',
    exemple:
      'Chaque fois qu’une ligne change dans la table des clients de l’ancien ERP, l’outil de CDC publie « client modifié », avec les valeurs avant et après.',
    aRetenir:
      'Le CDC publie des changements de tables, pas des faits métier : « statut = 3 » ne dit pas « commande expédiée ». Traduire en événement métier avant de partager.',
    liens: [
      {
        titre: 'Change data capture',
        url: 'https://en.wikipedia.org/wiki/Change_data_capture',
        langue: 'en',
      },
      {
        titre: 'Architecture de Debezium',
        url: 'https://debezium.io/documentation/reference/stable/architecture.html',
        langue: 'en',
      },
    ],
  },
  35: {
    definition:
      'Publish/Subscribe : un éditeur publie un message sans savoir qui le lira ; chaque abonné intéressé en reçoit une copie.',
    usage:
      'Diffuser un même fait à plusieurs consommateurs, et en ajouter de nouveaux sans toucher à l’éditeur : tout le contraire de l’appel point à point.',
    exemple:
      '« Client créé » est publié une fois ; le CRM, la facturation et l’envoi du courriel de bienvenue le reçoivent. Demain, la fidélité s’abonne sans rien changer au reste.',
    aRetenir:
      'Publier un fait, pas un ordre : « commande validée » plutôt que « facture cette commande ». L’éditeur ne doit pas dépendre de ce que font ses abonnés.',
    liens: [
      {
        titre: 'Publish-subscribe',
        url: 'https://fr.wikipedia.org/wiki/Publish-subscribe',
        langue: 'fr',
      },
      {
        titre: 'Publish-Subscribe Channel (Enterprise Integration Patterns)',
        url: 'https://www.enterpriseintegrationpatterns.com/patterns/messaging/PublishSubscribeChannel.html',
        langue: 'en',
      },
    ],
  },
  36: {
    definition:
      'L’adresse d’un événement, sous forme de chaîne hiérarchique comme ventes/commande/validee/v1/FR : les abonnés choisissent ce qu’ils reçoivent en s’abonnant à des motifs.',
    usage:
      'Router finement sans connaître les abonnés. Chez Solace, * remplace un niveau et > tous les niveaux suivants : on prend tout un pan (ventes/>) ou un seul pays.',
    exemple:
      'La logistique française s’abonne à ventes/commande/*/v1/FR : elle reçoit les commandes validées et annulées de France, et rien d’autre.',
    aRetenir:
      'Une taxonomie de topics se conçoit dès le départ : du plus général au plus précis, des niveaux stables, une version, et jamais de donnée personnelle dans le topic.',
    liens: [
      {
        titre: 'Understanding Topics (Solace)',
        url: 'https://docs.solace.com/Get-Started/what-are-topics.htm',
        langue: 'en',
      },
      {
        titre: 'Topic Architecture Best Practices (Solace)',
        url: 'https://docs.solace.com/Messaging/Topic-Architecture-Best-Practices.htm',
        langue: 'en',
      },
    ],
  },
  37: {
    definition:
      'Un tampon qui garde les messages dans leur ordre d’arrivée jusqu’à ce qu’un consommateur les traite et en accuse réception.',
    usage:
      'Absorber les pics, survivre à l’absence du consommateur et garantir la livraison : un message ne quitte la file qu’une fois traité.',
    exemple:
      'Pendant la maintenance de l’entrepôt, 3 000 commandes s’accumulent dans sa file ; au redémarrage, il les traite toutes, sans en perdre une seule.',
    aRetenir:
      'Une file qui ne fait que grandir signale un problème : surveiller sa profondeur et l’âge du plus vieux message, et prévoir une file pour les messages en échec.',
    liens: [
      {
        titre: 'Point-to-Point Channel (Enterprise Integration Patterns)',
        url: 'https://www.enterpriseintegrationpatterns.com/patterns/messaging/PointToPointChannel.html',
        langue: 'en',
      },
      {
        titre: 'Queues and Topic Endpoints (Solace)',
        url: 'https://docs.solace.com/Messaging/Guaranteed-Msg/Endpoints.htm',
        langue: 'en',
      },
    ],
  },
  38: {
    definition:
      'Une spécification ouverte pour décrire les API événementielles (canaux, opérations, messages et leurs schémas) : l’équivalent d’OpenAPI pour l’asynchrone.',
    usage:
      'Écrire le contrat d’un flux d’événements, le documenter, générer du code et le partager dans un catalogue : éditeurs et abonnés s’accordent sur le format avant d’écrire une ligne.',
    exemple:
      'Le fichier AsyncAPI de « commande validée » décrit le topic, le schéma du message et un exemple ; l’Event Portal l’importe, et les abonnés en génèrent leur code.',
    aRetenir:
      'Le schéma du message est le contrat : n’y ajouter que des champs facultatifs, et publier une nouvelle version pour tout changement qui casse.',
    liens: [
      {
        titre: 'AsyncAPI : les concepts',
        url: 'https://www.asyncapi.com/docs/concepts',
        langue: 'en',
      },
      {
        titre: 'La spécification AsyncAPI',
        url: 'https://www.asyncapi.com/docs/reference/specification/latest',
        langue: 'en',
      },
    ],
  },
};
