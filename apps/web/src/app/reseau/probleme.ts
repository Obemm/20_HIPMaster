import { HttpErrorResponse } from '@angular/common/http';
import { LANGUE } from '../langue';

/** Le corps d'une erreur de l'API (Problem Details) : un code stable, et des textes en français (US-082). */
export interface Probleme {
  code?: string;
  title?: string;
  detail?: string;
}

/**
 * Les refus d'action du moteur, par code stable (US-082) : ce que le joueur lit dans sa langue. Le texte français de
 * l'API, plus précis (il nomme la carte attendue, par exemple), reste celui de la version française et sert de repli.
 */
const ACTIONS_REFUSEES: Readonly<Record<string, () => string>> = {
  'partie-terminee': () => $localize`La partie est terminée.`,
  'carte-absente': () => $localize`Cette carte n’est plus là où vous l’avez choisie.`,
  'carte-non-prise-en-charge': () => $localize`Cette carte ne peut pas encore être jouée.`,
  'mauvais-type': () => $localize`Cette carte ne se joue pas ainsi.`,
  'debit-insuffisant': () => $localize`Pas assez de Débit pour jouer cette carte.`,
  'plateau-plein': () => $localize`Votre plateau est plein (5 composants).`,
  'origine-invalide': () => $localize`Cette évolution ne se pose pas sur ce composant.`,
  'deja-decommissionne': () => $localize`Vous avez déjà décommissionné une carte ce tour.`,
  'ne-peut-pas-attaquer': () => $localize`Ce composant ne peut pas attaquer maintenant.`,
  'cible-invalide': () => $localize`Cette cible ne convient pas.`,
  garde: () => $localize`Il faut d’abord attaquer un composant avec Garde.`,
  quotas: () => $localize`Quotas : ce composant a déjà subi 2 attaques ce tour.`,
};

/** Le corps Problem Details d'une erreur HTTP, s'il y en a un. */
export function problemeDe(erreur: unknown): Probleme | null {
  if (!(erreur instanceof HttpErrorResponse)) return null;
  const corps: unknown = erreur.error;
  return corps && typeof corps === 'object' ? (corps as Probleme) : null;
}

/** Pourquoi une action a été refusée, dans la langue du joueur ; le texte français de l'API en repli. */
export function messageActionRefusee(erreur: unknown): string {
  const probleme = problemeDe(erreur);
  const francais = probleme?.detail ?? probleme?.title;
  const traduit = probleme?.code ? ACTIONS_REFUSEES[probleme.code]?.() : undefined;
  return (
    (LANGUE === 'fr' ? francais : traduit) ?? traduit ?? francais ?? $localize`Action refusée.`
  );
}
