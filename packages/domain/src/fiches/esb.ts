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
  10: {
    definition:
      'Le broker de messages de la suite webMethods : il transporte les messages entre applications, en file ou en publication-abonnement, et prend en charge le standard Java JMS.',
    usage:
      'Faire circuler les messages de façon asynchrone entre Integration Server et les applications : l’émetteur n’attend pas le récepteur, et les messages sont gardés jusqu’à leur livraison.',
    exemple:
      'Integration Server publie le document « commande reçue » ; deux déclencheurs (triggers) abonnés le reçoivent par Universal Messaging et lancent chacun leur traitement.',
    aRetenir:
      'Un broker garde les messages, encore faut-il surveiller ce qu’il garde : files qui gonflent, abonnés déconnectés, messages expirés. Un broker saturé bloque tout le monde.',
    liens: [
      {
        titre: 'Message-oriented middleware',
        url: 'https://fr.wikipedia.org/wiki/Message-oriented_middleware',
        langue: 'fr',
      },
      {
        titre: 'Java Message Service',
        url: 'https://fr.wikipedia.org/wiki/Java_Message_Service',
        langue: 'fr',
      },
    ],
  },
  11: {
    definition:
      'Le serveur de portail de la suite webMethods : il héberge les interfaces web d’administration et de supervision des produits (suivi des processus, tâches, utilisateurs).',
    usage:
      'Suivre les processus et les services en cours, consulter les erreurs, relancer une exécution, gérer les tâches confiées à des humains et les droits des utilisateurs.',
    exemple:
      'Un flux de commandes est bloqué : depuis MWS, on retrouve l’instance de processus en erreur, on lit le message en cause, puis on la relance.',
    aRetenir:
      'Une console d’administration est un point sensible : accès restreints, comptes nominatifs. Et la supervision passe par des alertes, pas par la consultation manuelle de pages… qui chargent.',
    liens: [{ titre: 'webMethods', url: 'https://en.wikipedia.org/wiki/WebMethods', langue: 'en' }],
  },
  12: {
    definition:
      'Le middleware de messagerie lancé par IBM en 1993 sous le nom MQSeries, devenu WebSphere MQ puis IBM MQ : des files de messages fiables entre applications, sur presque tous les systèmes.',
    usage:
      'Garantir qu’un message arrive même si le destinataire est arrêté ou le réseau coupé : il attend dans une file, et son envoi peut faire partie d’une transaction. Très présent dans la banque et l’industrie.',
    exemple:
      'La facturation dépose une facture dans une file MQ ; l’ERP, arrêté pour maintenance, la consomme à son redémarrage, sans que personne ait rien renvoyé.',
    aRetenir:
      'Une file qui se remplit sans consommateur finit par refuser les messages : surveiller la profondeur des files et prévoir une file pour les messages en échec.',
    liens: [
      { titre: 'IBM MQ', url: 'https://fr.wikipedia.org/wiki/IBM_MQ', langue: 'fr' },
      { titre: 'IBM MQ (éditeur)', url: 'https://www.ibm.com/products/mq', langue: 'en' },
    ],
  },
  13: {
    definition:
      'Un connecteur qui permet à la plateforme d’intégration de dialoguer avec SAP : appeler ses fonctions à distance (RFC, BAPI) et échanger ses documents IDoc.',
    usage:
      'Lire et écrire dans l’ERP sans toucher à sa base : créer une commande, lire un article, recevoir les IDoc que SAP envoie quand une donnée change.',
    exemple:
      'Une commande validée sur le site web part vers l’intégration, qui appelle la BAPI de création de commande ; SAP renvoie le numéro de la commande créée.',
    aRetenir:
      'SAP impose ses formats et ses règles : documenter le mapping, traiter les erreurs métier renvoyées par SAP, et tester sur un système de qualification avant la production.',
    liens: [
      { titre: 'IDoc', url: 'https://en.wikipedia.org/wiki/IDoc', langue: 'en' },
      { titre: 'SAP (progiciel)', url: 'https://fr.wikipedia.org/wiki/SAP_ERP', langue: 'fr' },
    ],
  },
  14: {
    definition:
      'L’environnement de développement de webMethods, bâti sur Eclipse : on y crée, teste et débogue les services qui s’exécutent sur Integration Server.',
    usage:
      'Dessiner les flow services, définir les documents (structures de données), configurer les adaptateurs et les déclencheurs, puis déboguer pas à pas avec de vraies données.',
    exemple:
      'Un développeur ouvre le service de mapping des commandes, ajoute un champ, rejoue le message d’exemple en débogage, puis livre le paquet modifié.',
    aRetenir:
      'Le code vit dans des paquets (packages) : les versionner dans Git et les déployer avec un outil, plutôt que de les copier à la main d’un serveur à l’autre.',
    liens: [
      { titre: 'webMethods', url: 'https://en.wikipedia.org/wiki/WebMethods', langue: 'en' },
      {
        titre: 'Eclipse (projet)',
        url: 'https://fr.wikipedia.org/wiki/Eclipse_(projet)',
        langue: 'fr',
      },
    ],
  },
  15: {
    definition:
      'Un service écrit dans le langage graphique de webMethods : une suite d’étapes (MAP, INVOKE, BRANCH, LOOP…) qui se passent les données dans un « pipeline ».',
    usage:
      'Assembler un traitement d’intégration sans écrire de Java : recevoir un document, le transformer, appeler d’autres services, gérer les erreurs.',
    exemple:
      'Le service traiterCommande appelle un service de validation, mappe la commande vers le format SAP, invoque l’adaptateur, puis journalise le résultat.',
    aRetenir:
      'Un flow service lisible est court : le découper en sous-services réutilisables, retirer du pipeline les variables devenues inutiles, et prévoir un bloc de gestion des erreurs.',
    liens: [
      {
        titre: 'Pipes and Filters (Enterprise Integration Patterns)',
        url: 'https://www.enterpriseintegrationpatterns.com/patterns/messaging/PipesAndFilters.html',
        langue: 'en',
      },
      { titre: 'webMethods', url: 'https://en.wikipedia.org/wiki/WebMethods', langue: 'en' },
    ],
  },
  16: {
    definition:
      'Un connecteur qui relie la plateforme d’intégration à une base de données relationnelle par JDBC, l’interface standard de Java pour exécuter du SQL.',
    usage:
      'Lire, insérer ou mettre à jour des lignes, appeler des procédures stockées, ou guetter les nouvelles lignes d’une table pour déclencher un flux.',
    exemple:
      'Toutes les 10 minutes, l’adaptateur lit les nouvelles lignes de la table des expéditions et publie un événement pour chacune.',
    aRetenir:
      'Lire directement la base d’une autre application couple les deux systèmes : le moindre changement de schéma casse l’intégration. Préférer son API quand elle existe.',
    liens: [
      {
        titre: 'Java Database Connectivity',
        url: 'https://fr.wikipedia.org/wiki/Java_Database_Connectivity',
        langue: 'fr',
      },
    ],
  },
  17: {
    definition:
      'SOAP est un protocole d’échange de messages XML entre services web ; WSDL est le document XML qui décrit les opérations d’un service et le format de ses messages.',
    usage:
      'Le standard des services web des années 2000 : contrats stricts, types définis en XML Schema, extensions pour la sécurité (WS-Security). Encore très présent dans les ERP et les échanges B2B.',
    exemple:
      'Un transporteur publie son WSDL ; l’outil d’intégration en génère le client, qui appelle l’opération calculerTarif dans une enveloppe SOAP.',
    aRetenir:
      'Le contrat WSDL est une force : ne jamais le changer sans nouvelle version. Et une erreur SOAP (fault) revient souvent en HTTP 500 : lire son message avant de conclure à une panne.',
    liens: [
      { titre: 'SOAP', url: 'https://fr.wikipedia.org/wiki/SOAP', langue: 'fr' },
      {
        titre: 'Web Services Description Language',
        url: 'https://fr.wikipedia.org/wiki/Web_Services_Description_Language',
        langue: 'fr',
      },
    ],
  },
};
