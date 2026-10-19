import { describe, expect, it } from 'vitest';
import { appliquer } from './moteur.ts';
import { DECKS_PRETES } from './decks.ts';
import { NIVEAUX_BOT, trouverNiveau } from './niveaux.ts';
import { actionsPossibles } from './possibles.ts';
import { reconstituer } from './reconstitution.ts';
import { jouerPartie } from './simulation.ts';
import { creerPartie } from './tour.ts';
import { vueDe } from './vue.ts';

const [heritage, moderne, hybride] = DECKS_PRETES;
if (!heritage || !moderne || !hybride) throw new Error('decks prêtés manquants');

describe('niveaux du bot', () => {
  it('propose trois niveaux, du plus simple au plus fort', () => {
    expect(NIVEAUX_BOT.map((n) => n.id)).toEqual([
      'batch-de-nuit',
      'architecte-esb',
      'agent-autonome',
    ]);
    expect(trouverNiveau('agent-autonome')?.nom).toBe('Agent autonome');
    expect(trouverNiveau('inconnu')).toBeUndefined();
  });

  // Neuf parties complètes : plusieurs secondes sur un poste chargé, sans rapport avec une régression (US-043).
  it(
    'chaque niveau ne joue que des actions légales, et ses parties se terminent',
    { timeout: 30_000 },
    () => {
      for (const niveau of NIVEAUX_BOT) {
        for (let graine = 1; graine <= 3; graine++) {
          const fin = jouerPartie({ j1: hybride.cartes, j2: moderne.cartes }, graine, {
            j1: niveau.strategie,
            j2: niveau.strategie,
          });
          expect(fin.issue, `${niveau.nom}, graine ${graine}`).not.toBeNull();
        }
      }
    },
  );
});

describe('reconstitution d’un état depuis une vue', () => {
  it('redonne exactement les actions possibles de la vraie partie, tout au long d’une partie', () => {
    let etat = creerPartie({ j1: heritage.cartes, j2: hybride.cartes }, 42);
    let verifications = 0;
    for (let coup = 0; coup < 300 && !etat.issue; coup++) {
      const vue = vueDe(etat, etat.actif);
      expect(actionsPossibles(reconstituer(vue))).toEqual(vue.actions);
      verifications += 1;
      const action = trouverNiveau('agent-autonome')?.strategie(vue) ?? { type: 'finirTour' };
      const resultat = appliquer(etat, action);
      if (!resultat.ok) throw new Error(resultat.erreur.message);
      etat = resultat.etat;
    }
    expect(verifications).toBeGreaterThan(20);
  });

  it('cache ce que le joueur ne voit pas : main et pioche adverses deviennent des cartes neutres', () => {
    const etat = creerPartie({ j1: heritage.cartes, j2: moderne.cartes }, 9);
    const vue = vueDe(etat, etat.actif);
    const reconstitue = reconstituer(vue);
    const autre = etat.actif === 'j1' ? 'j2' : 'j1';
    expect(reconstitue.joueurs[autre].main).toHaveLength(etat.joueurs[autre].main.length);
    expect(new Set(reconstitue.joueurs[autre].main.map((c) => c.numero))).toEqual(new Set([4]));
    expect(reconstitue.joueurs[etat.actif].main).toEqual(etat.joueurs[etat.actif].main);
  });
});
