import type { Rarete } from '../libelles';

// Forme des cartes renvoyées par l'API (contrat : apps/api/openapi/cartes.yaml).
export type Famille =
  'fichiers' | 'esb' | 'api' | 'ipaas' | 'eda' | 'ia' | 'patterns' | 'bestiaire';
export type TypeCarte = 'composant' | 'evolution' | 'sort' | 'incident';

export interface Capacite {
  id: string;
  nom: string;
  description: string;
  valeur?: number;
}

export interface Carte {
  numero: number;
  nom: string;
  famille: Famille;
  type: TypeCarte;
  rarete: Rarete;
  cout: number;
  attaque?: number;
  pv?: number;
  origine?: number;
  ia?: boolean;
  capacites: Capacite[];
  effet?: string;
  enVrai: string;
}

/** Une ressource externe de la fiche « En savoir plus » (US-073). */
export interface LienExterne {
  titre: string;
  url: string;
  langue: 'fr' | 'en';
}

/** La fiche « En savoir plus » d'une carte (US-073, ADR 0036). */
export interface Fiche {
  definition: string;
  usage: string;
  exemple: string;
  aRetenir: string;
  chezElis?: string;
  liens: LienExterne[];
}

/** Le détail d'une carte (`GET /cartes/{numero}`) : la liste du catalogue ne porte pas la fiche. */
export interface CarteDetaillee extends Carte {
  fiche?: Fiche;
}

export const LIBELLES_FAMILLE: Record<Famille, string> = {
  fichiers: 'Fichiers & Batch',
  esb: 'Messagerie & ESB',
  api: 'API',
  ipaas: 'iPaaS',
  eda: 'Événementiel (EDA)',
  ia: 'IA agentique',
  patterns: 'Patterns',
  bestiaire: 'Bestiaire',
};

/**
 * Fond de la zone d'illustration par famille, en attendant les vraies illustrations (EPIC-05) :
 * un repère en plus du libellé de famille, jamais le seul.
 */
export const ILLUSTRATIONS_FAMILLE: Record<Famille, string> = {
  fichiers: 'from-amber-500 to-orange-800',
  esb: 'from-sky-500 to-blue-800',
  api: 'from-emerald-500 to-emerald-800',
  ipaas: 'from-teal-400 to-cyan-800',
  eda: 'from-violet-500 to-indigo-800',
  ia: 'from-fuchsia-500 to-purple-900',
  patterns: 'from-slate-400 to-slate-700',
  bestiaire: 'from-red-500 to-rose-900',
};

export function libelleType(carte: Carte): string {
  switch (carte.type) {
    case 'composant':
      return 'Composant';
    case 'evolution':
      return 'Évolution';
    case 'sort':
      return 'Sort';
    case 'incident':
      return carte.ia ? 'Incident IA' : 'Incident';
  }
}
