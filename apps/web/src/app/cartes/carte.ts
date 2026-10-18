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

/** Liseré de couleur par famille : un repère en plus du libellé, jamais le seul. */
export const LISERES_FAMILLE: Record<Famille, string> = {
  fichiers: 'border-l-amber-700',
  esb: 'border-l-sky-700',
  api: 'border-l-emerald-700',
  ipaas: 'border-l-teal-600',
  eda: 'border-l-violet-700',
  ia: 'border-l-fuchsia-700',
  patterns: 'border-l-zinc-500',
  bestiaire: 'border-l-red-700',
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
