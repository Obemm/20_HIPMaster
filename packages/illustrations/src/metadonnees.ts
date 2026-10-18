import { z } from 'zod';

/** Description d'une illustration dans `set-1.json` (ADR 0015). */
const schemaIllustration = z.object({
  numero: z.int().positive(),
  /** Ce que montre l'image, pour les lecteurs d'écran : une phrase, sans répéter le nom de la carte. */
  alt: z.string().trim().min(10, 'texte alternatif trop court (10 caractères au moins)').max(200),
  /** Consigne donnée au générateur, pour pouvoir refaire l'image. */
  consigne: z.string().optional(),
  provenance: z.object({ outil: z.string().min(1), date: z.iso.date() }),
});

const schemaFichier = z.object({ illustrations: z.array(schemaIllustration) });

export type Illustration = z.infer<typeof schemaIllustration>;

/**
 * Valide le contenu de `set-1.json` : forme des entrées, numéros de cartes existants et sans doublon.
 * Renvoie les illustrations triées par numéro, ou la liste des erreurs, une par ligne lisible.
 */
export function validerMetadonnees(
  contenu: unknown,
  numerosCartes: ReadonlySet<number>,
): { illustrations: Illustration[]; erreurs: string[] } {
  const resultat = schemaFichier.safeParse(contenu);
  if (!resultat.success) {
    const erreurs = resultat.error.issues.map(
      (probleme) => `${probleme.path.join('.') || 'fichier'} : ${probleme.message}`,
    );
    return { illustrations: [], erreurs };
  }

  const erreurs: string[] = [];
  const vus = new Set<number>();
  for (const { numero } of resultat.data.illustrations) {
    if (!numerosCartes.has(numero))
      erreurs.push(`carte ${numero} : aucune carte ne porte ce numéro`);
    if (vus.has(numero)) erreurs.push(`carte ${numero} : décrite plusieurs fois`);
    vus.add(numero);
  }
  const illustrations = resultat.data.illustrations.toSorted((a, b) => a.numero - b.numero);
  return { illustrations, erreurs };
}
