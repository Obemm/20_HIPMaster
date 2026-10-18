import type { IdCapacite } from '../capacites.ts';
import type { Carte } from '../carte.ts';
import type { Rarete } from '../rarete.ts';
import { trouverCarte } from '../set-1.ts';
import { aCapacite } from './prise-en-charge.ts';
import type {
  CodeErreur,
  ComposantEnJeu,
  EntreeJournal,
  ErreurAction,
  EtatPartie,
  IdJoueur,
  Issue,
} from './types.ts';

/** Constantes des règles (docs/produit/regles.md). */
export const SLA_INITIAL = 20;
export const MAIN_DEPART = 4;
export const MAIN_MAX = 8;
export const PLATEAU_MAX = 5;
export const DEBIT_MAX = 10;
/** Nombre de tours de la partie, tous joueurs confondus (10 chacun). */
export const TOURS_MAX = 20;
export const DEBIT_DECOMMISSION: Record<Rarete, number> = {
  commune: 1,
  rare: 1,
  epique: 2,
  legendaire: 3,
};

export function carteDe(numero: number): Carte {
  const carte = trouverCarte(numero);
  if (!carte) throw new Error(`Carte inconnue : ${numero}`);
  return carte;
}

export const adversaire = (joueur: IdJoueur): IdJoueur => (joueur === 'j1' ? 'j2' : 'j1');

export const erreur = (code: CodeErreur, message: string): ErreurAction => ({ code, message });

export function noter(etat: EtatPartie, entree: EntreeJournal): void {
  etat.journal.push(entree);
}

export function possede(composant: ComposantEnJeu, capacite: IdCapacite): boolean {
  return aCapacite(carteDe(composant.numero), capacite);
}

/** Attaque d'un composant, bonus de Hub compris (+1 par autre composant allié qui a Hub). */
export function attaqueEffective(
  etat: EtatPartie,
  joueur: IdJoueur,
  composant: ComposantEnJeu,
): number {
  const carte = carteDe(composant.numero);
  const base = 'attaque' in carte ? carte.attaque : 0;
  const hubs = etat.joueurs[joueur].plateau.filter(
    (allie) => allie.id !== composant.id && possede(allie, 'hub'),
  ).length;
  return base + hubs;
}

/** Le composant peut-il attaquer maintenant ? Renvoie la raison sinon. */
export function raisonDeNePasAttaquer(
  etat: EtatPartie,
  joueur: IdJoueur,
  composant: ComposantEnJeu,
): string | null {
  const tours = etat.joueurs[joueur].tours;
  if (composant.aAttaqueCeTour) return 'Ce composant a déjà attaqué ce tour.';
  if (composant.poseAuTour >= tours)
    return 'Un composant ne peut pas attaquer le tour où il est posé.';
  if (composant.entretienImpaye) return 'Entretien sur site impayé : pas d’attaque ce tour.';
  if (possede(composant, 'batch') && composant.dernierTourAttaque === tours - 1) {
    return 'Batch : ce composant a attaqué au tour précédent.';
  }
  if (attaqueEffective(etat, joueur, composant) <= 0) return 'Ce composant n’a pas d’attaque.';
  return null;
}

export function terminer(etat: EtatPartie, issue: Issue): void {
  if (etat.issue) return;
  etat.issue = issue;
  noter(etat, { type: 'fin-partie', issue });
}

/** Retire du SLA d'un SI ; à 0, l'adversaire gagne. */
export function blesserSi(
  etat: EtatPartie,
  joueur: IdJoueur,
  montant: number,
  cause: 'combat' | 'non-conforme',
): void {
  const victime = etat.joueurs[joueur];
  victime.sla -= montant;
  noter(etat, { type: 'degats', cible: 'si', joueur, montant, cause });
  if (victime.sla <= 0) terminer(etat, { gagnant: adversaire(joueur), raison: 'sla' });
}
