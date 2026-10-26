import { type Carte, type Famille, LIBELLES_FAMILLE } from '../cartes/carte';
import type { ProblemeDeck, ReglesDeck } from './mes-decks.service';

// L'écran de construction (US-083) annonce les règles et montre la forme du deck ; il ne décide rien : c'est le
// serveur qui vérifie le deck à l'enregistrement et au lancement d'une partie (ADR 0004, 0048).

/** Le dernier coût de la courbe regroupe les cartes plus chères (« 6+ »). */
export const COUT_MAX_COURBE = 6;

/** Le nombre d'exemplaires de chaque carte d'un deck. */
export function compter(cartes: readonly number[]): Map<number, number> {
  const exemplaires = new Map<number, number>();
  for (const numero of cartes) exemplaires.set(numero, (exemplaires.get(numero) ?? 0) + 1);
  return exemplaires;
}

/** Les exemplaires d'une carte qu'un deck peut contenir : 1 pour une légendaire. */
export const exemplairesPermis = (carte: Pick<Carte, 'rarete'>, regles: ReglesDeck) =>
  carte.rarete === 'legendaire' ? regles.exemplairesMaxLegendaire : regles.exemplairesMax;

/** La courbe de coût : le nombre de cartes du deck à chaque coût, de 1 à « 6+ ». */
export function courbeCout(
  cartes: readonly number[],
  catalogue: ReadonlyMap<number, Carte>,
): { cout: number; libelle: string; nombre: number }[] {
  const colonnes = Array.from({ length: COUT_MAX_COURBE }, (_, i) => ({
    cout: i + 1,
    libelle: i + 1 === COUT_MAX_COURBE ? `${COUT_MAX_COURBE}+` : `${i + 1}`,
    nombre: 0,
  }));
  for (const numero of cartes) {
    const cout = catalogue.get(numero)?.cout;
    if (cout === undefined) continue;
    const colonne = colonnes[Math.min(Math.max(cout, 1), COUT_MAX_COURBE) - 1];
    if (colonne) colonne.nombre += 1;
  }
  return colonnes;
}

/** La répartition par famille, des familles les plus présentes aux moins présentes. */
export function repartitionFamilles(
  cartes: readonly number[],
  catalogue: ReadonlyMap<number, Carte>,
): { famille: Famille; libelle: string; nombre: number }[] {
  const parFamille = new Map<Famille, number>();
  for (const numero of cartes) {
    const famille = catalogue.get(numero)?.famille;
    if (famille) parFamille.set(famille, (parFamille.get(famille) ?? 0) + 1);
  }
  return [...parFamille]
    .map(([famille, nombre]) => ({ famille, libelle: LIBELLES_FAMILLE[famille], nombre }))
    .sort((a, b) => b.nombre - a.nombre || a.libelle.localeCompare(b.libelle));
}

/** Ce qui manque ou dépasse, à dire pendant la construction ; vide pour un deck prêt à jouer. */
export function avertissements(
  cartes: readonly number[],
  catalogue: ReadonlyMap<number, Carte>,
  possedes: ReadonlyMap<number, number>,
  regles: ReglesDeck,
): string[] {
  const messages: string[] = [];
  const manque = regles.taille - cartes.length;
  if (manque > 0) {
    messages.push(
      manque === 1
        ? $localize`Il manque 1 carte pour jouer.`
        : $localize`Il manque ${manque}:nombre: cartes pour jouer.`,
    );
  } else if (manque < 0) {
    messages.push($localize`Trop de cartes : ${regles.taille}:taille: au plus.`);
  }
  for (const [numero, nombre] of compter(cartes)) {
    const carte = catalogue.get(numero);
    if (!carte) continue;
    const max = exemplairesPermis(carte, regles);
    if (nombre > max) {
      messages.push(
        $localize`${carte.nom}:carte: : ${nombre}:nombre: exemplaires, ${max}:max: au plus.`,
      );
    }
    const enCollection = possedes.get(numero) ?? 0;
    if (nombre > enCollection) {
      messages.push(
        $localize`${carte.nom}:carte: : ${nombre}:nombre: dans le deck, ${enCollection}:possedes: dans votre collection.`,
      );
    }
  }
  return messages;
}

/** Un problème renvoyé par le serveur, dans la langue du joueur. */
export function messageProbleme(probleme: ProblemeDeck, nom: (numero: number) => string): string {
  switch (probleme.code) {
    case 'taille':
      return $localize`Le deck compte ${probleme.cartes}:nombre: cartes : c’est trop.`;
    case 'carte-inconnue':
      return $localize`La carte n° ${probleme.numero}:numero: n’existe plus.`;
    case 'exemplaires':
      return $localize`${nom(probleme.numero)}:carte: : ${probleme.nombre}:nombre: exemplaires, ${probleme.max}:max: au plus.`;
    case 'non-possedee':
      return $localize`${nom(probleme.numero)}:carte: : ${probleme.nombre}:nombre: dans le deck, ${probleme.possedes}:possedes: dans votre collection.`;
  }
}

/** Un deck prêté limité aux exemplaires de la collection : le point de départ d'un deck à soi. */
export function limiterACollection(
  cartes: readonly number[],
  possedes: ReadonlyMap<number, number>,
): number[] {
  const pris = new Map<number, number>();
  return cartes.filter((numero) => {
    const deja = pris.get(numero) ?? 0;
    if (deja >= (possedes.get(numero) ?? 0)) return false;
    pris.set(numero, deja + 1);
    return true;
  });
}
