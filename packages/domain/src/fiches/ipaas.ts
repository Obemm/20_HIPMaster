import type { Fiche } from './fiche.ts';

/** Fiches « En savoir plus » de la famille iPaaS, par numéro de carte (ADR 0036). */
export const FICHES_IPAAS: Readonly<Record<number, Fiche>> = {
  26: {
    definition:
      'L’offre iPaaS (Integration Platform as a Service) de webMethods : l’intégration hébergée dans le cloud par l’éditeur, sans serveur à installer ni à mettre à jour.',
    usage:
      'Assembler des intégrations à partir de connecteurs prêts à l’emploi (applications SaaS, ERP, bases) et de flux dessinés, orchestrer plusieurs applications et exposer le résultat en API.',
    exemple:
      'Quand un client est créé dans le CRM, un flux webMethods.io le crée dans l’ERP, puis prévient le service facturation.',
    aRetenir:
      'Moins de serveurs ne veut pas dire moins de rigueur : versionner les flux, les tester, superviser les exécutions et surveiller la consommation restent indispensables.',
    chezElis:
      'La cible de l’ESB historique d’Elis : migrer vers l’iPaaS supprime l’entretien des serveurs sur site.',
    liens: [
      {
        titre: 'Cloud-based integration (iPaaS)',
        url: 'https://en.wikipedia.org/wiki/Cloud-based_integration',
        langue: 'en',
      },
      {
        titre: 'IBM webMethods Integration',
        url: 'https://www.ibm.com/products/webmethods-integration',
        langue: 'en',
      },
    ],
  },
  27: {
    definition:
      'Un connecteur prêt à l’emploi, fourni par la plateforme d’intégration, qui sait parler à un ERP (SAP, Oracle, Microsoft Dynamics…) : connexion, opérations, formats.',
    usage:
      'Gagner des semaines : au lieu de coder les appels à l’ERP, on choisit une opération (créer une commande, lire un article) et on fait correspondre les champs.',
    exemple:
      'Dans un flux iPaaS, l’étape « SAP : créer une commande » reçoit la commande du site e-commerce et renvoie le numéro de commande SAP.',
    aRetenir:
      'Le connecteur simplifie le transport, pas le métier : il faut toujours comprendre les données de l’ERP, ses règles de validation et ses limites d’appels.',
    liens: [
      {
        titre: 'Progiciel de gestion intégré',
        url: 'https://fr.wikipedia.org/wiki/Progiciel_de_gestion_int%C3%A9gr%C3%A9',
        langue: 'fr',
      },
    ],
  },
  28: {
    definition:
      'Un connecteur prêt à l’emploi vers une application en ligne (CRM, RH, messagerie, stockage…), qui gère pour vous l’authentification et l’API de l’éditeur.',
    usage:
      'Brancher une application cloud en quelques minutes : déclencher un flux sur un événement (« nouveau contact ») et appeler des actions (« créer un ticket »).',
    exemple:
      'Quand un ticket urgent est créé dans l’outil de support, un flux iPaaS alerte le canal de l’équipe et crée une tâche dans le gestionnaire de projets.',
    aRetenir:
      'L’éditeur change son API, le connecteur suit… parfois en retard. Surveiller les dépréciations, gérer les comptes de service et leurs secrets, et respecter les limites d’appels du SaaS.',
    liens: [
      {
        titre: 'Logiciel en tant que service',
        url: 'https://fr.wikipedia.org/wiki/Logiciel_en_tant_que_service',
        langue: 'fr',
      },
      {
        titre: 'Cloud-based integration (iPaaS)',
        url: 'https://en.wikipedia.org/wiki/Cloud-based_integration',
        langue: 'en',
      },
    ],
  },
  29: {
    definition:
      'Un flux d’intégration construit en assemblant visuellement des étapes (déclencheur, actions, conditions, boucles) plutôt qu’en écrivant du code.',
    usage:
      'Aller vite sur les intégrations simples et les ouvrir à des profils moins techniques ; le code reste possible pour les cas particuliers.',
    exemple:
      'Déclencheur : une nouvelle commande en boutique. Condition : plus de 1 000 €. Action : demander une validation par courriel, puis créer la commande dans l’ERP.',
    aRetenir:
      'Dessiné ne veut pas dire sans ingénierie : nommer les étapes, gérer les erreurs, tester, versionner et documenter, sinon le flux devient vite un plat de spaghettis.',
    liens: [
      {
        titre: 'Low-code development platform',
        url: 'https://en.wikipedia.org/wiki/Low-code_development_platform',
        langue: 'en',
      },
    ],
  },
  30: {
    definition:
      'La correspondance entre les champs d’un format source et ceux d’un format cible, avec les transformations nécessaires : renommer, convertir, calculer, regrouper.',
    usage:
      'Faire se comprendre deux systèmes qui ne parlent pas pareil (dates, unités, codes pays, structures imbriquées). C’est le « Message Translator » des Enterprise Integration Patterns.',
    exemple:
      'dateCommande « 24/10/2026 » devient orderDate « 2026-10-24 », et le pays « France » devient « FR » grâce à une table de correspondance.',
    aRetenir:
      'Beaucoup d’incidents d’intégration naissent dans le mapping : documenter chaque règle, traiter les valeurs vides ou inconnues, et tester avec de vraies données.',
    liens: [
      {
        titre: 'Message Translator (Enterprise Integration Patterns)',
        url: 'https://www.enterpriseintegrationpatterns.com/patterns/messaging/MessageTranslator.html',
        langue: 'en',
      },
      { titre: 'Data mapping', url: 'https://en.wikipedia.org/wiki/Data_mapping', langue: 'en' },
    ],
  },
};
