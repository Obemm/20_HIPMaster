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
}

export interface Issue {
  /** `null` : partie nulle. */
  gagnant: IdJoueur | null;
  raison: 'sla' | 'tours';
}

export type Cible = string | 'si';

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
      cause: 'combat' | 'riposte' | 'diffusion' | 'reactif' | 'point-unique' | 'non-conforme';
    }
  | { type: 'destruction'; joueur: IdJoueur; carte: InstanceCarte }
  | { type: 'retour-main'; joueur: IdJoueur; carte: InstanceCarte }
  | { type: 'entretien'; joueur: IdJoueur; carte: string; paye: boolean }
  | { type: 'supervision'; joueur: IdJoueur; carte: InstanceCarte | null }
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
