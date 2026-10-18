import { trouverCarte } from '../set-1.ts';

/** Règles d'un deck (docs/produit/regles.md). */
export const TAILLE_DECK = 20;
export const EXEMPLAIRES_MAX = 2;
export const EXEMPLAIRES_MAX_LEGENDAIRE = 1;

export interface DeckPrete {
  id: string;
  nom: string;
  description: string;
  cartes: readonly number[];
}

/** Vérifie un deck ; renvoie la liste des problèmes (vide si le deck est valide). */
export function validerDeck(cartes: readonly number[]): string[] {
  const problemes: string[] = [];
  if (cartes.length !== TAILLE_DECK) {
    problemes.push(`Un deck compte ${TAILLE_DECK} cartes (celui-ci en a ${cartes.length}).`);
  }
  const exemplaires = new Map<number, number>();
  for (const numero of cartes) exemplaires.set(numero, (exemplaires.get(numero) ?? 0) + 1);
  for (const [numero, nombre] of exemplaires) {
    const carte = trouverCarte(numero);
    if (!carte) {
      problemes.push(`La carte n° ${numero} n’existe pas.`);
      continue;
    }
    const max = carte.rarete === 'legendaire' ? EXEMPLAIRES_MAX_LEGENDAIRE : EXEMPLAIRES_MAX;
    if (nombre > max) problemes.push(`${carte.nom} : ${nombre} exemplaires, ${max} au plus.`);
  }
  return problemes;
}

/** Écrit un deck sous la forme « numéro × nombre » pour rester lisible. */
const deck = (...lignes: [numero: number, nombre: number][]): number[] =>
  lignes.flatMap(([numero, nombre]) => Array.from({ length: nombre }, () => numero));

/**
 * Decks prêtés aux joueurs tant que leur collection est petite (US-011). Ils ne contiennent que des cartes que le
 * moteur sait jouer entièrement (`CARTES_PRISES_EN_CHARGE`). Composition équilibrée par simulation : chaque duel
 * reste entre 43 et 56 % de victoires, sorts et incidents compris (docs/produit/cartes-set-1.md).
 */
export const DECKS_PRETES: readonly DeckPrete[] = [
  {
    id: 'heritage',
    nom: 'Héritage',
    description:
      'Fichiers et ESB : lent, solide, un peu non conforme. FTP et webMethods mènent la danse, la Dead Letter Queue rattrape les pertes.',
    cartes: deck(
      [1, 1], // FTP
      [3, 2], // EDI
      [4, 1], // Fichier CSV
      [5, 1], // Fichier à positions fixes
      [7, 2], // Répertoire de dépôt
      [9, 2], // webMethods Integration Server 10.15
      [26, 1], // webMethods.io
      [10, 1], // Universal Messaging
      [11, 1], // MWS
      [12, 2], // MQSeries
      [13, 1], // Adaptateur SAP
      [16, 1], // Adaptateur JDBC
      [17, 1], // SOAP / WSDL
      [53, 1], // Dead Letter Queue
      [58, 1], // Retry
      [64, 1], // Message poison
    ),
  },
  {
    id: 'moderne',
    nom: 'Moderne',
    description:
      'API, iPaaS et événements : Apigee protège, Solace diffuse, les connecteurs font piocher, le Content-Based Router fait le tri.',
    cartes: deck(
      [18, 1], // Apigee API Gateway
      [22, 2], // API REST
      [24, 1], // Portail développeur
      [25, 2], // Webhook
      [27, 1], // Connecteur ERP
      [28, 2], // Connecteur SaaS
      [29, 1], // Workflow low-code
      [31, 2], // Solace Event Mesh
      [33, 1], // Event broker
      [35, 2], // Pub/Sub
      [36, 2], // Topic
      [37, 1], // File d’attente
      [55, 1], // Content-Based Router
      [64, 1], // Message poison
    ),
  },
  {
    id: 'hybride',
    nom: 'Hybride',
    description:
      'Un peu de chaque époque, un LLM pour frapper fort : la plateforme hybride en un deck.',
    cartes: deck(
      [1, 1], // FTP
      [9, 1], // webMethods Integration Server 10.15
      [26, 1], // webMethods.io
      [18, 1], // Apigee API Gateway
      [31, 1], // Solace Event Mesh
      [41, 1], // LLM
      [13, 1], // Adaptateur SAP
      [12, 1], // MQSeries
      [25, 1], // Webhook
      [22, 2], // API REST
      [4, 1], // Fichier CSV
      [36, 1], // Topic
      [35, 1], // Pub/Sub
      [17, 1], // SOAP / WSDL
      [28, 1], // Connecteur SaaS
      [47, 1], // Chain of thought
      [62, 1], // Couplage fort
      [66, 1], // Doublon
      [71, 1], // Facture de tokens
    ),
  },
];

export function trouverDeckPrete(id: string): DeckPrete | undefined {
  return DECKS_PRETES.find((d) => d.id === id);
}
