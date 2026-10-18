import type { IdCapacite } from '../capacites.ts';
import type { Carte, CapaciteCarte } from '../carte.ts';
import { SET_1 } from '../set-1.ts';

/**
 * Capacités appliquées par le moteur (US-010) ; les autres arrivent avec US-014.
 * Vétéran (immunité contre les cartes IA) est respecté d'office tant qu'aucune carte IA ne cible.
 */
export const CAPACITES_PRISES_EN_CHARGE: ReadonlySet<IdCapacite> = new Set<IdCapacite>([
  'veteran',
  'garde',
  'batch',
  'hub',
  'point-unique',
  'quotas',
  'connecteur',
  'diffusion',
  'reactif',
  'non-conforme',
  'sur-site',
  'file-durable',
  'supervision',
  // US-020
  'migration',
  'autonome',
  'orchestration',
  'outillage',
  'delegation',
  'contexte',
  'garde-fous',
  'asynchrone',
  'cache-semantique',
  'routage-multi-modeles',
]);

const idCapacite = (capacite: CapaciteCarte): IdCapacite =>
  typeof capacite === 'string' ? capacite : capacite.id;

/** Sorts et incidents dont l'effet est appliqué (US-014) : voir `EFFETS` dans effets.ts. */
export const SORTS_ET_INCIDENTS_PRIS_EN_CHARGE: ReadonlySet<number> = new Set([
  21, 30, 47, 48, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70,
  71,
]);

/**
 * Composants dont l'effet propre est appliqué : les parades d'US-014 (Fichier .ok témoin, OAuth2) et les effets
 * d'US-019 (Cron, Designer, API Hub, OpenAPI, Event Portal, CDC, AsyncAPI, Base vectorielle).
 */
export const COMPOSANTS_A_EFFET: ReadonlySet<number> = new Set([
  6, 8, 14, 19, 20, 23, 32, 34, 38, 39, 49,
]);

/** Une carte est jouable entièrement : ses capacités et son effet éventuel sont tous appliqués par le moteur. */
export function estPriseEnCharge(carte: Carte): boolean {
  if (SORTS_ET_INCIDENTS_PRIS_EN_CHARGE.has(carte.numero)) return true;
  const effetGere = carte.effet === undefined || COMPOSANTS_A_EFFET.has(carte.numero);
  return (
    (carte.type === 'composant' || carte.type === 'evolution') &&
    effetGere &&
    carte.capacites.every((capacite) => CAPACITES_PRISES_EN_CHARGE.has(idCapacite(capacite)))
  );
}

/** Numéros des cartes du set 1 que le moteur sait jouer entièrement. */
export const CARTES_PRISES_EN_CHARGE: readonly number[] = SET_1.filter(estPriseEnCharge).map(
  (carte) => carte.numero,
);

/** Indique si une carte porte une capacité ; pour Connecteur, renvoie aussi sa valeur. */
export function aCapacite(carte: Carte, id: IdCapacite): boolean {
  return carte.capacites.some((capacite) => idCapacite(capacite) === id);
}

export function valeurConnecteur(carte: Carte): number {
  const connecteur = carte.capacites.find(
    (capacite): capacite is { id: 'connecteur'; valeur: number } =>
      typeof capacite !== 'string' && capacite.id === 'connecteur',
  );
  return connecteur?.valeur ?? 0;
}
