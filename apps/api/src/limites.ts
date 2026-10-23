/**
 * Limitation de débit par adresse IP (US-047, ADR 0025) : une fenêtre fixe par route et par adresse (une adresse IPv6
 * compte pour son préfixe /64), dans la mémoire de l'instance. Les valeurs sont documentées dans les contrats OpenAPI.
 */

export interface Limite {
  /** Requêtes acceptées par fenêtre. */
  max: number;
  /** Durée de la fenêtre, en millisecondes. */
  fenetreMs: number;
}

const MINUTE = 60_000;
const HEURE = 60 * MINUTE;

/**
 * Valeurs de production, pensées pour quelques dizaines de joueurs dont beaucoup partagent l'adresse de leur bureau.
 * Chaque route a son propre compteur.
 */
export const LIMITES_DEBIT = {
  /** `POST /joueurs` : création de comptes en série. */
  inscription: { max: 30, fenetreMs: HEURE },
  /** `POST /sessions` : essais de codes de récupération. */
  connexion: { max: 10, fenetreMs: MINUTE },
  /** `POST /parties` : à ce rythme, une adresse seule ne remplit jamais le dépôt en mémoire (ADR 0014). */
  creationPartie: { max: 20, fenetreMs: MINUTE },
  /** `POST /parties/{id}/actions` : chaque fin de tour fait jouer le bot. */
  actionPartie: { max: 300, fenetreMs: MINUTE },
  /** `POST /duels` et `POST /duels/hasard` : chaque défi est une ligne en base. */
  creationDuel: { max: 60, fenetreMs: HEURE },
  /** Coups d'un duel : actions, rejoindre, abandonner, annuler. */
  coupDuel: { max: 300, fenetreMs: MINUTE },
  /** `GET /duels/{id}` et `GET /moi/duels`, interrogés toutes les 3 s et toutes les 60 s (ADR 0020). */
  lectureDuel: { max: 600, fenetreMs: MINUTE },
  /** Routes d'administration (US-072, ADR 0029), comptées une fois l'administrateur reconnu. */
  administration: { max: 60, fenetreMs: MINUTE },
} as const satisfies Record<string, Limite>;

export type NomLimite = keyof typeof LIMITES_DEBIT;
export type LimitesDebit = Record<NomLimite, Limite>;

/** Les limites de production multipliées par `facteur` (réglage `LIMITES_DEBIT`), à une requête par fenêtre au moins. */
export function limitesMultipliees(facteur: number): LimitesDebit {
  const limites = {} as LimitesDebit;
  for (const [nom, { max, fenetreMs }] of Object.entries(LIMITES_DEBIT)) {
    limites[nom as NomLimite] = { max: Math.max(1, Math.round(max * facteur)), fenetreMs };
  }
  return limites;
}

/**
 * Les réglages d'une route pour `@fastify/rate-limit` (option `config` de la route) ; aucune limite quand la
 * limitation est désactivée (`limites` absentes).
 */
export function limiter(
  limites: LimitesDebit | undefined,
  nom: NomLimite,
): { rateLimit: { max: number; timeWindow: number } | false } {
  const limite = limites?.[nom];
  return { rateLimit: limite ? { max: limite.max, timeWindow: limite.fenetreMs } : false };
}
