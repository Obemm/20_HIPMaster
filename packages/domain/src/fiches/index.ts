import type { Famille } from '../carte.ts';
import { FICHES_API } from './api.ts';
import { FICHES_BESTIAIRE } from './bestiaire.ts';
import { FICHES_EDA } from './eda.ts';
import type { Fiche } from './fiche.ts';
import { FICHES_FICHIERS } from './fichiers.ts';
import { FICHES_ESB } from './esb.ts';
import { FICHES_IA } from './ia.ts';
import { FICHES_IPAAS } from './ipaas.ts';
import { FICHES_PATTERNS } from './patterns.ts';

/** Les fiches du set 1, rangées par famille : un fichier par famille, relu famille par famille (US-074). */
export const FICHES_PAR_FAMILLE: Readonly<Record<Famille, Readonly<Record<number, Fiche>>>> = {
  fichiers: FICHES_FICHIERS,
  esb: FICHES_ESB,
  api: FICHES_API,
  ipaas: FICHES_IPAAS,
  eda: FICHES_EDA,
  ia: FICHES_IA,
  patterns: FICHES_PATTERNS,
  bestiaire: FICHES_BESTIAIRE,
};

const FICHES_SET_1 = new Map<number, Fiche>(
  Object.values(FICHES_PAR_FAMILLE).flatMap((fiches) =>
    Object.entries(fiches).map(([numero, fiche]) => [Number(numero), fiche] as const),
  ),
);

/** La fiche « En savoir plus » d'une carte, si elle est rédigée (ADR 0034). */
export function ficheDe(numero: number): Fiche | undefined {
  return FICHES_SET_1.get(numero);
}

export {
  LANGUES_LIEN,
  LIMITES_FICHE,
  problemesFiche,
  type Fiche,
  type LangueLien,
  type LienExterne,
} from './fiche.ts';
