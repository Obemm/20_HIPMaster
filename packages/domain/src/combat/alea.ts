/**
 * Générateurs de hasard à graine : leur état est gardé dans la partie, ce qui rend les parties rejouables (ADR 0013).
 *
 * - **ChaCha20** (ADR 0034) pour les parties jouées en ligne : une clé de 256 bits tirée par le serveur et un compteur
 *   de blocs. Ses sorties ne permettent pas de retrouver la clé : un joueur ne peut pas prévoir la suite de la partie.
 * - **mulberry32** : un entier de 32 bits, rapide mais prévisible (2³² graines s'essaient en quelques minutes). Gardé
 *   pour les simulations, les tests et les parties créées avant l'ADR 0034, qui se terminent avec lui.
 */

/** État ChaCha20 : clé de 8 mots de 32 bits, et numéro du prochain bloc (un tirage par bloc). */
export interface EtatChaCha20 {
  cle: number[];
  bloc: number;
}

/** État du générateur d'une partie : un entier (mulberry32) ou une clé ChaCha20 et son compteur. */
export type EtatAlea = number | EtatChaCha20;

/** Graine d'une partie : un entier (mulberry32) ou une clé ChaCha20 de 8 mots de 32 bits. */
export type Graine = number | readonly number[];

const MOTS_CLE = 8;
const MOT_MAX = 0xffff_ffff;
const DEUX_PUISSANCE_32 = 4_294_967_296;
/** « expand 32-byte k », les constantes de ChaCha20 (RFC 8439). */
const CONSTANTES = [0x6170_7865, 0x3320_646e, 0x7962_2d32, 0x6b20_6574];

/** mulberry32 : un pas du générateur 32 bits. */
export function suivant(etat: number): { valeur: number; etat: number } {
  const nouvelEtat = (etat + 0x6d2b79f5) | 0;
  let t = nouvelEtat;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return { valeur: ((t ^ (t >>> 14)) >>> 0) / DEUX_PUISSANCE_32, etat: nouvelEtat };
}

/** L'état initial du générateur pour une graine ; une clé ChaCha20 doit compter 8 mots de 32 bits. */
export function etatAlea(graine: Graine): EtatAlea {
  if (typeof graine === 'number') return graine | 0;
  const valide = (mot: number) => Number.isInteger(mot) && mot >= 0 && mot <= MOT_MAX;
  if (graine.length !== MOTS_CLE || !graine.every(valide)) {
    throw new Error('Une clé ChaCha20 compte 8 mots de 32 bits.');
  }
  return { cle: [...graine], bloc: 0 };
}

const rotation = (valeur: number, decalage: number) =>
  (valeur << decalage) | (valeur >>> (32 - decalage));

/** Quart de tour de ChaCha20, sur des entiers 32 bits (`| 0`) ; le `Uint32Array` les range sans signe. */
function quartDeTour(x: Uint32Array, a: number, b: number, c: number, d: number): void {
  let va = x[a] ?? 0;
  let vb = x[b] ?? 0;
  let vc = x[c] ?? 0;
  let vd = x[d] ?? 0;
  va = (va + vb) | 0;
  vd = rotation(vd ^ va, 16);
  vc = (vc + vd) | 0;
  vb = rotation(vb ^ vc, 12);
  va = (va + vb) | 0;
  vd = rotation(vd ^ va, 8);
  vc = (vc + vd) | 0;
  vb = rotation(vb ^ vc, 7);
  x[a] = va;
  x[b] = vb;
  x[c] = vc;
  x[d] = vd;
}

/** Un bloc de ChaCha20 (RFC 8439, § 2.3) : 16 mots de 32 bits, pour une clé, un compteur et un nonce de 3 mots. */
export function blocChaCha20(
  cle: readonly number[],
  compteur: number,
  nonce: readonly number[] = [0, 0, 0],
): number[] {
  const initial = Uint32Array.from([...CONSTANTES, ...cle, compteur, ...nonce]);
  const x = initial.slice();
  for (let double = 0; double < 10; double++) {
    quartDeTour(x, 0, 4, 8, 12);
    quartDeTour(x, 1, 5, 9, 13);
    quartDeTour(x, 2, 6, 10, 14);
    quartDeTour(x, 3, 7, 11, 15);
    quartDeTour(x, 0, 5, 10, 15);
    quartDeTour(x, 1, 6, 11, 12);
    quartDeTour(x, 2, 7, 8, 13);
    quartDeTour(x, 3, 4, 9, 14);
  }
  return Array.from(x, (mot, i) => (mot + (initial[i] ?? 0)) >>> 0);
}

/** Porte l'état du générateur et l'avance à chaque tirage. */
export interface SourceAlea {
  alea: EtatAlea;
}

/** Nombre dans [0, 1[ ; avance l'état du générateur. */
export function tirer(source: SourceAlea): number {
  const etat = source.alea;
  if (typeof etat === 'number') {
    const { valeur, etat: nouvelEtat } = suivant(etat);
    source.alea = nouvelEtat;
    return valeur;
  }
  const [mot = 0] = blocChaCha20(etat.cle, etat.bloc);
  source.alea = { cle: etat.cle, bloc: etat.bloc + 1 };
  return mot / DEUX_PUISSANCE_32;
}

/** Entier dans [0, max[. */
export function tirerIndex(source: SourceAlea, max: number): number {
  return Math.floor(tirer(source) * max);
}

/** Mélange de Fisher-Yates, en place. */
export function melanger<T>(source: SourceAlea, liste: T[]): void {
  for (let i = liste.length - 1; i > 0; i--) {
    const j = tirerIndex(source, i + 1);
    [liste[i], liste[j]] = [liste[j] as T, liste[i] as T];
  }
}
