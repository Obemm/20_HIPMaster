/**
 * Les administrateurs (US-072, ADR 0029) : les comptes dont l'identifiant figure dans le réglage `ADMINISTRATEURS` de
 * l'API, jamais une donnée venue du front. Hors production seulement, `tous` fait de chaque compte un administrateur
 * (parcours e2e, essai en développement).
 */

/** La valeur qui fait de chaque compte un administrateur, refusée en production. */
export const TOUS = 'tous';

export type Administrateurs = ReadonlySet<string> | typeof TOUS;

/** Personne : la valeur par défaut. */
export const AUCUN: Administrateurs = new Set<string>();

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Lit le réglage : des identifiants de joueur séparés par des virgules ou des espaces, ou `tous`. Renvoie les
 * administrateurs, ou ce qui ne va pas.
 */
export function lireAdministrateurs(
  valeur: string | undefined,
): { administrateurs: Administrateurs } | { erreur: string } {
  const elements = (valeur ?? '').split(/[\s,]+/).filter(Boolean);
  if (elements.includes(TOUS)) {
    return elements.length === 1
      ? { administrateurs: TOUS }
      : { erreur: `« ${TOUS} » s’emploie seul` };
  }
  const invalides = elements.filter((element) => !UUID.test(element));
  if (invalides.length > 0) {
    return {
      erreur: `des identifiants de joueur (UUID) étaient attendus : ${invalides.join(', ')}`,
    };
  }
  return { administrateurs: new Set(elements.map((element) => element.toLowerCase())) };
}

export function estAdministrateur(administrateurs: Administrateurs, joueurId: string): boolean {
  return administrateurs === TOUS || administrateurs.has(joueurId.toLowerCase());
}
