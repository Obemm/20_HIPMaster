import { CAPACITES, type Capacite, type IdCapacite } from './capacites.ts';
import type { Rarete } from './rarete.ts';

/** Familles de cartes : six époques de l'intégration, puis deux familles transverses (docs/produit/univers.md). */
export const FAMILLES = [
  'fichiers',
  'esb',
  'api',
  'ipaas',
  'eda',
  'ia',
  'patterns',
  'bestiaire',
] as const;
export type Famille = (typeof FAMILLES)[number];

export const TYPES_CARTE = ['composant', 'evolution', 'sort', 'incident'] as const;
export type TypeCarte = (typeof TYPES_CARTE)[number];

/** Une capacité portée par une carte ; seule Connecteur prend une valeur (nombre de cartes piochées). */
export type CapaciteCarte =
  Exclude<IdCapacite, 'connecteur'> | { id: 'connecteur'; valeur: number };

interface BaseCarte {
  /** Identifiant stable : une carte publiée n'est jamais renumérotée (ADR 0011). */
  numero: number;
  nom: string;
  famille: Famille;
  rarete: Rarete;
  /** Coût en Débit. */
  cout: number;
  capacites: readonly CapaciteCarte[];
  /** Effet propre à la carte, quand il n'est pas couvert par une capacité. */
  effet?: string;
  /** Explication pédagogique : ce que la technologie fait en vrai. */
  enVrai: string;
}

export interface Composant extends BaseCarte {
  type: 'composant';
  attaque: number;
  pv: number;
}

/** Se pose à la place de la carte d'origine (docs/produit/regles.md). */
export interface Evolution extends BaseCarte {
  type: 'evolution';
  attaque: number;
  pv: number;
  /** Numéro de la carte dont elle est issue. */
  origine: number;
}

export interface Sort extends BaseCarte {
  type: 'sort';
}

export interface Incident extends BaseCarte {
  type: 'incident';
  /** Incident IA : ne vise que les composants IA, et Vétéran y est immunisé. */
  ia: boolean;
}

export type Carte = Composant | Evolution | Sort | Incident;

export interface CapaciteDetaillee extends Capacite {
  valeur?: number;
}

/** Remplace les identifiants de capacités d'une carte par leur nom et leur description. */
export function detaillerCapacites(carte: Carte): CapaciteDetaillee[] {
  return carte.capacites.map((capacite) => {
    if (typeof capacite === 'string') return { ...CAPACITES[capacite] };
    const { nom, ...reste } = CAPACITES[capacite.id];
    return { ...reste, nom: `${nom} (${capacite.valeur})`, valeur: capacite.valeur };
  });
}
