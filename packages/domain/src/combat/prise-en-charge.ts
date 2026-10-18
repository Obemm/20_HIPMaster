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
]);

const idCapacite = (capacite: CapaciteCarte): IdCapacite =>
  typeof capacite === 'string' ? capacite : capacite.id;

/** Une carte est jouable entièrement : un composant ou une évolution, sans effet propre ni capacité inconnue. */
export function estPriseEnCharge(carte: Carte): boolean {
  return (
    (carte.type === 'composant' || carte.type === 'evolution') &&
    carte.effet === undefined &&
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
