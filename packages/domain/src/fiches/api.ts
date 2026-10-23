import type { Fiche } from './fiche.ts';

/** Fiches « En savoir plus » de la famille API, par numéro de carte (ADR 0034). */
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
  19: {
    definition:
      'Le catalogue central des API dans Apigee : il recense les API d’une organisation, leurs versions, leurs spécifications et leurs responsables, qu’elles passent par Apigee ou non.',
    usage:
      'Savoir quelles API existent avant d’en créer une nouvelle, trouver le bon contrat et son équipe, et contrôler la qualité des spécifications avec des règles de style.',
    exemple:
      'Avant d’écrire une API « clients », une équipe cherche dans l’API Hub et découvre qu’elle existe déjà, avec sa spécification OpenAPI et l’équipe à contacter.',
    aRetenir:
      'Un catalogue ne vaut que s’il est à jour : enregistrer chaque API dès sa conception, avec un responsable et un statut (en conception, en production, dépréciée).',
    liens: [
      {
        titre: 'What is Apigee API hub?',
        url: 'https://docs.cloud.google.com/apigee/docs/apihub/what-is-api-hub',
        langue: 'en',
      },
    ],
  },
  20: {
    definition:
      'Un cadre d’autorisation (RFC 6749) qui permet à une application d’accéder à une ressource avec un jeton à durée limitée, sans jamais connaître le mot de passe de l’utilisateur.',
    usage:
      'Sécuriser les API : le client obtient un jeton d’accès auprès d’un serveur d’autorisation, puis le présente à chaque appel ; l’API vérifie le jeton et ses droits (scopes).',
    exemple:
      'Un batch appelle l’API des factures : il échange son identifiant et son secret de client contre un jeton valable une heure (flux client credentials), qu’il joint à chaque requête.',
    aRetenir:
      'OAuth2 autorise, il n’authentifie pas l’utilisateur : c’est le rôle d’OpenID Connect. Des jetons courts, des scopes étroits, et jamais de jeton dans une URL.',
    liens: [
      { titre: 'OAuth', url: 'https://fr.wikipedia.org/wiki/OAuth', langue: 'fr' },
      { titre: 'OAuth 2.0', url: 'https://oauth.net/2/', langue: 'en' },
    ],
  },
  21: {
    definition:
      'Limiter le nombre d’appels qu’un consommateur peut faire en un temps donné : au-delà, l’API répond 429 Too Many Requests.',
    usage:
      'Protéger un service d’une surcharge, partager équitablement sa capacité entre consommateurs, et faire respecter des contrats d’usage (quotas par jour ou par mois).',
    exemple:
      'Une application boguée appelle l’API en boucle : la passerelle laisse passer 100 requêtes par seconde, répond 429 au reste, et le service derrière tient bon.',
    aRetenir:
      'Pour le consommateur, un 429 n’est pas une panne : attendre (en-tête Retry-After) puis réessayer. Pour le fournisseur, distinguer la protection contre les pics des quotas commerciaux.',
    liens: [
      {
        titre: '429 Too Many Requests (MDN)',
        url: 'https://developer.mozilla.org/fr/docs/Web/HTTP/Reference/Status/429',
        langue: 'fr',
      },
      {
        titre: 'Limiter le débit avec Apigee',
        url: 'https://docs.cloud.google.com/apigee/docs/api-platform/develop/rate-limiting?hl=fr',
        langue: 'fr',
      },
    ],
  },
  22: {
    definition:
      'Un style d’architecture (Roy Fielding, 2000) où l’on manipule des ressources désignées par des URL avec les verbes HTTP : GET lit, POST crée, PUT ou PATCH modifie, DELETE supprime.',
    usage:
      'La façon la plus répandue d’exposer des données et des services : simple, sans état, avec des formats ouverts (souvent JSON) et les codes de statut HTTP.',
    exemple:
      'GET /clients/42 renvoie le client 42 en JSON ; POST /clients en crée un et répond 201, avec l’adresse du nouveau client dans l’en-tête Location.',
    aRetenir:
      'Une bonne API REST se conçoit par son contrat, avant le code : noms de ressources au pluriel, codes HTTP justes, erreurs normalisées (RFC 9457) et versions.',
    liens: [
      {
        titre: 'Representational state transfer',
        url: 'https://fr.wikipedia.org/wiki/Representational_state_transfer',
        langue: 'fr',
      },
      {
        titre: 'REST (glossaire MDN)',
        url: 'https://developer.mozilla.org/fr/docs/Glossary/REST',
        langue: 'fr',
      },
    ],
  },
  23: {
    definition:
      'Une spécification ouverte, issue de Swagger, pour décrire une API REST dans un fichier YAML ou JSON : chemins, opérations, paramètres, réponses et schémas de données.',
    usage:
      'Écrire le contrat avant le code, en tirer la documentation, des clients et des bouchons, valider les requêtes et tester l’API contre sa spécification.',
    exemple:
      'Ce jeu en est un exemple : chaque route de son API est d’abord décrite en OpenAPI, puis codée, et les tests vérifient les réponses contre ce contrat.',
    aRetenir:
      'Une spécification qu’on ne vérifie pas finit par mentir : la tester automatiquement contre l’implémentation, et la versionner comme du code.',
    liens: [
      { titre: 'OpenAPI Initiative', url: 'https://www.openapis.org/', langue: 'en' },
      {
        titre: 'La spécification OpenAPI',
        url: 'https://spec.openapis.org/oas/latest.html',
        langue: 'en',
      },
    ],
  },
  24: {
    definition:
      'Le site où les développeurs découvrent les API d’une organisation, lisent leur documentation, les essaient et demandent à y accéder.',
    usage:
      'Rendre les API faciles à trouver et à consommer, sans réunion : documentation à jour, console d’essai, inscription et clés d’API en libre-service.',
    exemple:
      'Un développeur d’une filiale trouve l’API des tarifs sur le portail, l’essaie dans la console, puis inscrit son application et reçoit sa clé.',
    aRetenir:
      'Une API sans documentation n’existe pas pour ses consommateurs : des exemples concrets, un guide de démarrage et des erreurs expliquées valent mieux qu’une longue référence.',
    liens: [
      {
        titre: 'Créer un portail intégré (Apigee)',
        url: 'https://docs.cloud.google.com/apigee/docs/api-platform/publish/portal/build-integrated-portal?hl=fr',
        langue: 'fr',
      },
    ],
  },
  25: {
    definition:
      'Un appel HTTP qu’un système envoie de lui-même, à une adresse fournie par un autre, quand un événement se produit : l’API qui vous rappelle au lieu que vous l’interrogiez sans cesse.',
    usage:
      'Être prévenu en temps réel sans scruter (polling) : paiement accepté, colis livré, document signé. Très utilisé par les applications SaaS.',
    exemple:
      'Le prestataire de paiement appelle POST /webhooks/paiements dès qu’un paiement est confirmé ; l’intégration répond 200 aussitôt, puis traite le paiement.',
    aRetenir:
      'Un webhook arrive parfois en double, en retard, ou d’un imposteur : vérifier sa signature, le traiter de façon idempotente, et répondre vite pour traiter ensuite.',
    liens: [
      { titre: 'Webhook', url: 'https://fr.wikipedia.org/wiki/Webhook', langue: 'fr' },
      { titre: 'Standard Webhooks', url: 'https://www.standardwebhooks.com/', langue: 'en' },
    ],
  },
};
