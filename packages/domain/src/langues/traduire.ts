/**
 * Le catalogue dans la langue du joueur (US-081, ADR 0043) : chaque texte vient de la traduction de la langue
 * demandée, et du français, qui fait foi, quand elle manque (un test vérifie qu'il n'en manque aucune).
 */
import { CAPACITES, type IdCapacite } from '../capacites.ts';
import type { Carte } from '../carte.ts';
import type { Fiche } from '../fiches/fiche.ts';
import { ficheDe as ficheFrancaise } from '../fiches/index.ts';
import { TEXTES_EN } from './en/index.ts';
import {
  LANGUE_REFERENCE,
  LANGUES,
  type Langue,
  type TexteCapacite,
  type TexteCarte,
  type TexteNomme,
  type TextesLangue,
} from './textes.ts';

const TRADUCTIONS: Readonly<Partial<Record<Langue, TextesLangue>>> = { en: TEXTES_EN };

/** Une langue connue du jeu, à partir d'une valeur quelconque (paramètre d'URL…) ; le français à défaut. */
export function langueOuReference(valeur: unknown): Langue {
  return LANGUES.find((langue) => langue === valeur) ?? LANGUE_REFERENCE;
}

/** Les textes d'une langue autre que le français, s'il y en a. */
export function textesDe(langue: Langue): TextesLangue | undefined {
  return TRADUCTIONS[langue];
}

/** Nom, effet et « En vrai » d'une carte dans une langue. */
export function texteCarte(carte: Carte, langue: Langue): TexteCarte {
  const traduction = TRADUCTIONS[langue]?.cartes[carte.numero];
  return {
    nom: traduction?.nom ?? carte.nom,
    ...(carte.effet !== undefined && { effet: traduction?.effet ?? carte.effet }),
    enVrai: traduction?.enVrai ?? carte.enVrai,
  };
}

/** La carte avec ses textes dans une langue ; ses règles (coût, statistiques, capacités) ne changent pas. */
export function traduireCarte<C extends Carte>(carte: C, langue: Langue): C {
  return langue === LANGUE_REFERENCE ? carte : { ...carte, ...texteCarte(carte, langue) };
}

/** Nom et description d'une capacité dans une langue. */
export function texteCapacite(id: IdCapacite, langue: Langue): TexteCapacite {
  const { nom, description } = CAPACITES[id];
  return TRADUCTIONS[langue]?.capacites[id] ?? { nom, description };
}

/** La fiche « En savoir plus » d'une carte dans une langue, si elle est rédigée (ADR 0036). */
export function ficheDe(numero: number, langue: Langue = LANGUE_REFERENCE): Fiche | undefined {
  return TRADUCTIONS[langue]?.fiches[numero] ?? ficheFrancaise(numero);
}

/** Un niveau de bot ou un deck prêté, son nom et sa description dans une langue. */
export function traduireNomme<T extends TexteNomme & { id: string }>(
  element: T,
  langue: Langue,
  table: 'niveaux' | 'decks',
): T {
  const traduction = TRADUCTIONS[langue]?.[table][element.id];
  return traduction ? { ...element, ...traduction } : element;
}
