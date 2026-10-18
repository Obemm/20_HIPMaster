import { creerPartie } from './tour.ts';
import type { Action, ComposantEnJeu, EtatPartie, IdJoueur, InstanceCarte } from './types.ts';
import { appliquer } from './moteur.ts';
import { carteDe } from './outils.ts';

/** Utilitaires de test du moteur (non exportés par le paquet). */

export const DECK_API_REST: readonly number[] = Array.from({ length: 20 }, () => 22);

export interface ComposantDeTest {
  numero: number;
  pv?: number;
  /** Posé au tour 1 par défaut : il peut attaquer. */
  poseAuTour?: number;
  dernierTourAttaque?: number | null;
}

export interface Scenario {
  main?: number[];
  plateau?: (number | ComposantDeTest)[];
  plateauAdverse?: (number | ComposantDeTest)[];
  debit?: number;
  pioche?: number[];
  piocheAdverse?: number[];
}

function composant(prefixe: string, i: number, valeur: number | ComposantDeTest): ComposantEnJeu {
  const def = typeof valeur === 'number' ? { numero: valeur } : valeur;
  const carte = carteDe(def.numero);
  return {
    id: `${prefixe}${i + 1}`,
    numero: def.numero,
    pv: def.pv ?? ('pv' in carte ? carte.pv : 1),
    poseAuTour: def.poseAuTour ?? 1,
    aAttaqueCeTour: false,
    dernierTourAttaque: def.dernierTourAttaque ?? null,
    attaquesSubies: 0,
    reactifUtilise: false,
    entretienImpaye: false,
  };
}

const instances = (prefixe: string, numeros: number[]): InstanceCarte[] =>
  numeros.map((numero, i) => ({ id: `${prefixe}${i + 1}`, numero }));

/**
 * Une partie au tour 5 où j1 joue (son 3e tour) : main `m1…`, plateau `a1…`, plateau adverse `b1…`,
 * Débit 10 par défaut, journal vidé.
 */
export function scenario(s: Scenario = {}): EtatPartie {
  const etat = creerPartie({ j1: DECK_API_REST, j2: DECK_API_REST }, 7);
  etat.premier = 'j1';
  etat.actif = 'j1';
  etat.tour = 5;
  const { j1, j2 } = etat.joueurs;
  j1.tours = 3;
  j2.tours = 2;
  j1.debit = s.debit ?? 10;
  j1.aDecommissionne = false;
  j1.main = instances('m', s.main ?? []);
  j1.plateau = (s.plateau ?? []).map((v, i) => composant('a', i, v));
  j2.plateau = (s.plateauAdverse ?? []).map((v, i) => composant('b', i, v));
  if (s.pioche) j1.pioche = instances('p', s.pioche);
  if (s.piocheAdverse) j2.pioche = instances('q', s.piocheAdverse);
  etat.journal = [];
  return etat;
}

/** Applique une action qui doit réussir. */
export function jouer(etat: EtatPartie, action: Action): EtatPartie {
  const resultat = appliquer(etat, action);
  if (!resultat.ok) throw new Error(`Action refusée : ${resultat.erreur.message}`);
  return resultat.etat;
}

export function codeErreur(etat: EtatPartie, action: Action): string | null {
  const resultat = appliquer(etat, action);
  return resultat.ok ? null : resultat.erreur.code;
}

export const pv = (etat: EtatPartie, joueur: IdJoueur, id: string): number | undefined =>
  etat.joueurs[joueur].plateau.find((c) => c.id === id)?.pv;
