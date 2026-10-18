// Forme des parties renvoyées par l'API (contrat : apps/api/openapi/parties.yaml). Aucune règle de jeu ici :
// l'écran affiche la vue et envoie les actions proposées par le serveur (ADR 0004, 0006).

export type IdJoueur = 'j1' | 'j2';

export interface Instance {
  id: string;
  numero: number;
}

export interface Composant extends Instance {
  pv: number;
  /** Attaque effective, bonus compris (calculée par le serveur). */
  attaque: number;
  poseAuTour: number;
  aAttaqueCeTour: boolean;
  /** Statuts posés par les sorts et les incidents (US-014). */
  immobiliseJusquAuTour?: number | null;
  sansCapacitesJusquAuTour?: number | null;
  doublon?: boolean;
  attaqueNulle?: boolean;
  coupleA?: string | null;
  capacitesEmpruntees?: string[];
}

interface Camp {
  sla: number;
  debit: number;
  tours: number;
  plateau: Composant[];
  defausse: Instance[];
  pioche: number;
}

export type Action =
  | { type: 'poser'; carte: string; cible?: string }
  | { type: 'evoluer'; carte: string; origine: string }
  | { type: 'decommissionner'; carte: string }
  | { type: 'attaquer'; attaquant: string; cible: string }
  | { type: 'jouer'; carte: string; cibles: string[] }
  | { type: 'outiller'; source: string }
  | { type: 'router'; retour: string; carte: string }
  | { type: 'migrer'; source: string; carte: string }
  | { type: 'finirTour' };

export interface Issue {
  gagnant: IdJoueur | null;
  raison: 'sla' | 'tours';
}

export interface Vue {
  joueur: IdJoueur;
  moi: Camp & { main: Instance[]; aDecommissionne: boolean };
  adversaire: Camp & { main: number };
  actif: IdJoueur;
  tour: number;
  issue: Issue | null;
  actions: Action[];
}

/** Un événement du journal ; ses champs dépendent de son type (packages/domain/src/combat/types.ts). */
export interface Evenement {
  type: string;
  joueur?: IdJoueur;
  tour?: number;
  /** La carte concernée ; un simple identifiant pour l'entretien (Sur site). */
  carte?: Instance | string | null;
  origine?: Instance;
  debit?: number;
  attaquant?: string;
  cible?: string;
  montant?: number;
  cause?: string;
  paye?: boolean;
  issue?: Issue;
  cibles?: string[];
  source?: string;
  retour?: Instance;
  statut?: string;
}

export interface Partie {
  id: string;
  deck: string;
  deckAdversaire: string;
  /** Niveau du bot adverse (US-021). */
  niveau: string;
  vue: Vue;
  evenements: Evenement[];
}

/** Un niveau du bot, du plus simple au plus fort (US-021). */
export interface Niveau {
  id: string;
  nom: string;
  description: string;
}

export interface Deck {
  id: string;
  nom: string;
  description: string;
  cartes: number[];
}

/** Nombre de tours d'une partie, tous joueurs confondus (règles). */
export const TOURS_MAX = 20;
