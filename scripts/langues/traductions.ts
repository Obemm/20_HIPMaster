/** Fichiers de traduction d'Angular au format JSON (`ng extract-i18n --format json`) : identifiant → texte. */
export interface FichierTraductions {
  locale: string;
  translations: Record<string, string>;
}

export interface Ecart {
  /** Identifiants de la référence absents de l'autre fichier. */
  manquantes: string[];
  /** Identifiants de l'autre fichier inconnus de la référence. */
  orphelines: string[];
  /** Identifiants présents des deux côtés, au texte différent (pour comparer deux extractions). */
  modifiees: string[];
}

/** Compare des traductions à la référence, les textes extraits du code. */
export function comparerTraductions(
  reference: Record<string, string>,
  autres: Record<string, string>,
): Ecart {
  const ids = Object.keys(reference);
  return {
    manquantes: ids.filter((id) => !Object.hasOwn(autres, id)),
    orphelines: Object.keys(autres).filter((id) => !Object.hasOwn(reference, id)),
    modifiees: ids.filter((id) => Object.hasOwn(autres, id) && autres[id] !== reference[id]),
  };
}
