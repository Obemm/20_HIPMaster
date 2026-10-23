import { describe, expect, it } from 'vitest';
import { DECKS_PRETES } from './decks.ts';
import { blocChaCha20, etatAlea, type SourceAlea, suivant, tirer, tirerIndex } from './alea.ts';
import { creerPartie } from './tour.ts';
import { vueDe } from './vue.ts';

const CLE_RFC = [
  0x0302_0100, 0x0706_0504, 0x0b0a_0908, 0x0f0e_0d0c, 0x1312_1110, 0x1716_1514, 0x1b1a_1918,
  0x1f1e_1d1c,
];
const CLE = [1, 2, 3, 4, 5, 6, 7, 8];

const [moderne, heritage] = DECKS_PRETES;
const decks = { j1: moderne?.cartes ?? [], j2: heritage?.cartes ?? [] };

describe('ChaCha20 (ADR 0034)', () => {
  it('donne le bloc de test de la RFC 8439 (§ 2.3.2)', () => {
    expect(blocChaCha20(CLE_RFC, 1, [0x0900_0000, 0x4a00_0000, 0])).toEqual([
      0xe4e7_f110, 0x1559_3bd1, 0x1fdd_0f50, 0xc471_20a3, 0xc7f4_d1c7, 0x0368_c033, 0x9aaa_2204,
      0x4e6c_d4c3, 0x4664_82d2, 0x09aa_9f07, 0x05d7_c214, 0xa202_8bd9, 0xd19c_12b5, 0xb94e_16de,
      0xe883_d0cb, 0x4e3c_50a2,
    ]);
  });

  it('donne le flux de clé d’OpenSSL pour une clé nulle (blocs 0 et 1)', () => {
    const nulle = Array.from({ length: 8 }, () => 0);
    expect(blocChaCha20(nulle, 0)[0]).toBe(0xade0_b876);
    expect(blocChaCha20(nulle, 1)[0]).toBe(0xbee7_079f);
  });

  it('tire un nombre dans [0, 1[ par bloc et avance le compteur', () => {
    const source: SourceAlea = { alea: etatAlea(CLE) };
    const valeurs = Array.from({ length: 1000 }, () => tirer(source));

    expect(source.alea).toEqual({ cle: CLE, bloc: 1000 });
    expect(valeurs.every((v) => v >= 0 && v < 1)).toBe(true);
    const moyenne = valeurs.reduce((a, b) => a + b, 0) / valeurs.length;
    expect(moyenne).toBeGreaterThan(0.45);
    expect(moyenne).toBeLessThan(0.55);
  });

  it('répartit les index sans trou', () => {
    const source: SourceAlea = { alea: etatAlea(CLE) };
    const comptes = [0, 0, 0, 0, 0, 0];
    for (let i = 0; i < 6000; i++) {
      const index = tirerIndex(source, 6);
      comptes[index] = (comptes[index] ?? 0) + 1;
    }
    for (const compte of comptes) expect(compte).toBeGreaterThan(850);
  });

  it('refuse une clé qui n’a pas 8 mots de 32 bits', () => {
    expect(() => etatAlea([1, 2, 3])).toThrow('8 mots de 32 bits');
    expect(() => etatAlea([1, 2, 3, 4, 5, 6, 7, 2 ** 32])).toThrow('8 mots de 32 bits');
    expect(() => etatAlea([1, 2, 3, 4, 5, 6, 7, -1])).toThrow('8 mots de 32 bits');
  });
});

describe('graine d’une partie', () => {
  it('la même clé redonne la même partie ; une autre clé, une autre partie', () => {
    const partie = creerPartie(decks, CLE);

    expect(creerPartie(decks, CLE)).toEqual(partie);
    expect(creerPartie(decks, [...CLE.slice(0, 7), 9])).not.toEqual(partie);
  });

  it('une partie à graine entière (créée avant l’ADR 0034) garde mulberry32', () => {
    const partie = creerPartie(decks, 42);

    expect(typeof partie.alea).toBe('number');
    const source: SourceAlea = { alea: partie.alea };
    expect(tirer(source)).toBe(suivant(partie.alea as number).valeur);
  });

  it('la vue d’un joueur ne contient jamais l’état du générateur', () => {
    const partie = creerPartie(decks, CLE);
    const texte = JSON.stringify(vueDe(partie, 'j1'));

    expect(texte).not.toContain('"alea"');
    expect(texte).not.toContain('"cle"');
  });
});
