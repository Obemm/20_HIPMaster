import { describe, expect, it } from 'vitest';
import { choisirActionStagiaire } from './bot-stagiaire.ts';
import { conseiller } from './conseil.ts';
import { validerDeck } from './decks.ts';
import { appliquer } from './moteur.ts';
import {
  DECK_INITIATION,
  DECK_INITIATION_BOT,
  ETAPES_PARTIE_GUIDEE,
  GRAINE_PARTIE_GUIDEE,
} from './partie-guidee.ts';
import { CARTES_PRISES_EN_CHARGE } from './prise-en-charge.ts';
import { creerPartie } from './tour.ts';
import type { Action, EtatPartie } from './types.ts';
import { vueDe } from './vue.ts';

/** Fait jouer Stagiaire tant que c'est son tour. */
function tourDuBot(etat: EtatPartie): EtatPartie {
  let courant = etat;
  while (!courant.issue && courant.actif === 'j2') {
    const resultat = appliquer(courant, choisirActionStagiaire(vueDe(courant, 'j2')));
    if (!resultat.ok) throw new Error(resultat.erreur.message);
    courant = resultat.etat;
  }
  return courant;
}

function jouer(etat: EtatPartie, action: Action): EtatPartie {
  const vue = vueDe(etat, 'j1');
  expect(vue.actions).toContainEqual(action);
  const resultat = appliquer(etat, action);
  if (!resultat.ok) throw new Error(resultat.erreur.message);
  return tourDuBot(resultat.etat);
}

const depart = () =>
  tourDuBot(
    creerPartie(
      { j1: DECK_INITIATION.cartes, j2: DECK_INITIATION_BOT.cartes },
      GRAINE_PARTIE_GUIDEE,
    ),
  );

describe('partie guidée (US-067)', () => {
  it('a des decks valides, que le moteur sait jouer, et le joueur commence', () => {
    for (const deck of [DECK_INITIATION, DECK_INITIATION_BOT]) {
      expect(validerDeck(deck.cartes), deck.nom).toEqual([]);
      expect(deck.cartes.every((n) => CARTES_PRISES_EN_CHARGE.includes(n))).toBe(true);
    }
    expect(depart().premier).toBe('j1');
  });

  it('chaque étape attend une action légale au moment où elle arrive, jusqu’à la dernière, libre', () => {
    let etat = depart();
    const guidees = ETAPES_PARTIE_GUIDEE.slice(0, -1);
    for (const etape of guidees) {
      if (!etape.attendu) throw new Error(`Étape sans action : ${etape.titre}`);
      etat = jouer(etat, etape.attendu);
    }
    expect(ETAPES_PARTIE_GUIDEE.at(-1)?.attendu).toBeNull();
    expect(etat.issue).toBeNull();
  });

  it('montre bien la Garde du bot au moment de l’étape qui en parle', () => {
    let etat = depart();
    const garde = ETAPES_PARTIE_GUIDEE.findIndex((e) => e.titre === 'La Garde');
    for (const etape of ETAPES_PARTIE_GUIDEE.slice(0, garde)) {
      if (etape.attendu) etat = jouer(etat, etape.attendu);
    }
    const vue = vueDe(etat, 'j1');
    expect(vue.adversaire.plateau.find((c) => c.id === 'j2-08')?.numero).toBe(7);
    expect(vue.actions).not.toContainEqual({ type: 'attaquer', attaquant: 'j1-06', cible: 'si' });
  });

  it('se gagne vite ensuite en suivant le conseil : moins de 5 minutes de jeu', () => {
    let etat = depart();
    let actions = 0;
    for (const etape of ETAPES_PARTIE_GUIDEE) {
      if (etape.attendu) {
        etat = jouer(etat, etape.attendu);
        actions += 1;
      }
    }
    while (!etat.issue) {
      const conseil = conseiller(vueDe(etat, 'j1'));
      if (!conseil) throw new Error('Aucun conseil pendant le tour du joueur.');
      etat = jouer(etat, conseil.action);
      actions += 1;
    }
    expect(etat.issue).toEqual({ gagnant: 'j1', raison: 'sla' });
    expect(etat.tour).toBeLessThanOrEqual(13);
    expect(actions).toBeLessThanOrEqual(30);
  });
});
