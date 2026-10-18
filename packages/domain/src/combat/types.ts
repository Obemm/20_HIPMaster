/** Types du moteur de combat (ADR 0013) : un état JSON simple, sérialisable et comparable. */

export const JOUEURS = ['j1', 'j2'] as const;
export type IdJoueur = (typeof JOUEURS)[number];

/** Une carte précise d'une partie : identifiant d'instance stable et numéro de la carte du catalogue. */
export interface InstanceCarte {
  id: string;
  numero: number;
}

/** Un composant (ou une évolution) posé sur le plateau. */
export interface ComposantEnJeu extends InstanceCarte {
  pv: number;
  /** Tour du propriétaire où la carte est arrivée en jeu (une évolution reprend celui de sa carte d'origine). */
  poseAuTour: number;
  aAttaqueCeTour: boolean;
  /** Dernier tour du propriétaire où la carte a attaqué (pour Batch). */
  dernierTourAttaque: number | null;
  /** Attaques subies pendant le tour en cours (pour Quotas). */
  attaquesSubies: number;
  /** Réactif déjà déclenché pendant le tour en cours. */
  reactifUtilise: boolean;
  /** Sur site : entretien impayé, la carte ne peut pas attaquer ce tour. */
  entretienImpaye: boolean;
  /** Bonus d'attaque permanent (Prompt système, Few-shot). */
  bonusAttaque: number;
  /** Ne peut pas attaquer jusqu'à ce tour inclus (Rate limiting, Timeout…). */
  immobiliseJusquAuTour: number | null;
  /** Capacités suspendues jusqu'à ce tour inclus (Certificat expiré, Contexte saturé). */
  sansCapacitesJusquAuTour: number | null;
  /** Doublon : le prochain dégât subi est doublé. */
  doublon: boolean;
  /** Fichier vide à 3 h du matin : la prochaine attaque n'inflige aucun dégât. */
  attaqueNulle: boolean;
  /** Couplage fort : identifiant du composant lié, qui subit les mêmes dégâts. */
  coupleA: string | null;
}

export interface EtatJoueur {
  sla: number;
  debit: number;
  /** Nombre de tours commencés par ce joueur. */
  tours: number;
  pioche: InstanceCarte[];
  main: InstanceCarte[];
  plateau: ComposantEnJeu[];
  defausse: InstanceCarte[];
  aDecommissionne: boolean;
  fileDurableUtilisee: boolean;
  /** Human-in-the-loop : le prochain incident joué contre ce joueur est sans effet. */
  parade: boolean;
  /** Circuit Breaker : le SI ne perd aucun SLA jusqu'à ce tour inclus. */
  siProtegeJusquAuTour: number | null;
  /** Facture de tokens : Débit retiré au prochain tour. */
  malusDebit: number;
}

export interface Issue {
  /** `null` : partie nulle. */
  gagnant: IdJoueur | null;
  raison: 'sla' | 'tours';
}

export type Cible = string | 'si';

export type CauseDegats =
  | 'combat'
  | 'riposte'
  | 'diffusion'
  | 'reactif'
  | 'point-unique'
  | 'non-conforme'
  | 'effet'
  | 'couplage';

/** Changements d'état annoncés dans le journal (sorts et incidents). */
export type Statut =
  | 'immobilise'
  | 'sans-capacites'
  | 'doublon'
  | 'doublon-annule'
  | 'attaque-nulle'
  | 'couplage'
  | 'bonus-attaque'
  | 'bonus-pv'
  | 'attaque-a-nouveau'
  | 'protection-si'
  | 'parade'
  | 'malus-debit';

export type Evenement =
  | { type: 'debut-tour'; joueur: IdJoueur; tour: number }
  | { type: 'pioche'; joueur: IdJoueur; carte: InstanceCarte }
  | { type: 'carte-brulee'; joueur: IdJoueur; carte: InstanceCarte }
  | { type: 'pose'; joueur: IdJoueur; carte: InstanceCarte }
  | { type: 'evolution'; joueur: IdJoueur; carte: InstanceCarte; origine: InstanceCarte }
  | { type: 'decommission'; joueur: IdJoueur; carte: InstanceCarte; debit: number }
  | { type: 'attaque'; joueur: IdJoueur; attaquant: string; cible: Cible }
  | {
      type: 'degats';
      cible: Cible;
      joueur: IdJoueur;
      montant: number;
      cause: CauseDegats;
    }
  | { type: 'destruction'; joueur: IdJoueur; carte: InstanceCarte }
  | { type: 'retour-main'; joueur: IdJoueur; carte: InstanceCarte }
  | { type: 'entretien'; joueur: IdJoueur; carte: string; paye: boolean }
  | { type: 'supervision'; joueur: IdJoueur; carte: InstanceCarte | null }
  | { type: 'jeu'; joueur: IdJoueur; carte: InstanceCarte; cibles: Cible[] }
  | { type: 'parade'; joueur: IdJoueur; carte: InstanceCarte }
  | { type: 'statut'; joueur: IdJoueur; cible: Cible; statut: Statut }
  | { type: 'rappel'; joueur: IdJoueur; carte: InstanceCarte }
  | { type: 'si-protege'; joueur: IdJoueur }
  | { type: 'fin-partie'; issue: Issue };

/** Une entrée du journal ; `pour` restreint l'événement à un joueur (carte piochée, Supervision). */
export type EntreeJournal = Evenement & { pour?: IdJoueur };

export interface EtatPartie {
  joueurs: Record<IdJoueur, EtatJoueur>;
  premier: IdJoueur;
  actif: IdJoueur;
  /** Numéro du tour en cours, tous joueurs confondus (1, 2, 3…). */
  tour: number;
  issue: Issue | null;
  /** État du générateur de hasard à graine. */
  alea: number;
  journal: EntreeJournal[];
}

export type Action =
  | { type: 'poser'; carte: string }
  | { type: 'evoluer'; carte: string; origine: string }
  | { type: 'decommissionner'; carte: string }
  | { type: 'attaquer'; attaquant: string; cible: Cible }
  /** Joue un sort ou un incident, avec ses cibles éventuelles (composants, carte de la défausse ou `si`). */
  | { type: 'jouer'; carte: string; cibles: Cible[] }
  | { type: 'finirTour' };

export const CODES_ERREUR = [
  'partie-terminee',
  'carte-absente',
  'carte-non-prise-en-charge',
  'mauvais-type',
  'debit-insuffisant',
  'plateau-plein',
  'origine-invalide',
  'deja-decommissionne',
  'ne-peut-pas-attaquer',
  'cible-invalide',
  'garde',
  'quotas',
] as const;
export type CodeErreur = (typeof CODES_ERREUR)[number];

export interface ErreurAction {
  code: CodeErreur;
  message: string;
}

export type ResultatAction = { ok: true; etat: EtatPartie } | { ok: false; erreur: ErreurAction };
