import {
  choisirActionAgentAutonome,
  choisirActionBatchDeNuit,
  DECKS_PRETES,
  jouerPartie,
  reconstituer,
  vueDe,
  creerPartie,
  appliquer,
  type Strategie,
  type VueJoueur,
} from '@hipmaster/domain';
import { describe, expect, it } from 'vitest';
import { schemaPartie } from './schemas.ts';

const [heritage, moderne, hybride] = DECKS_PRETES;
if (!heritage || !moderne || !hybride) throw new Error('decks prêtés manquants');

/** La vue telle qu'un client la reçoit : passée par le schéma de réponse puis par JSON (US-026). */
const commeLApi = (vue: VueJoueur): VueJoueur =>
  ({
    ...JSON.parse(JSON.stringify(schemaPartie.shape.vue.parse(vue))),
    journal: [],
  }) as VueJoueur;

describe('vue publique d’une partie (US-026)', () => {
  it('garde tout ce dont un bot a besoin pour reconstituer la partie', () => {
    let etat = creerPartie({ j1: heritage.cartes, j2: hybride.cartes }, 42);
    for (let coup = 0; coup < 300 && !etat.issue; coup++) {
      const vue = vueDe(etat, etat.actif);
      expect(reconstituer(commeLApi(vue))).toEqual(reconstituer({ ...vue, journal: [] }));
      const resultat = appliquer(etat, choisirActionAgentAutonome(vue));
      if (!resultat.ok) throw new Error(resultat.erreur.message);
      etat = resultat.etat;
    }
  });

  it('l’Agent autonome joué depuis la vue de l’API bat le Batch de nuit', () => {
    const agent: Strategie = (vue) => choisirActionAgentAutonome(commeLApi(vue));
    let victoires = 0;
    const parties = 10;
    for (let graine = 1; graine <= parties; graine++) {
      const fin = jouerPartie({ j1: moderne.cartes, j2: moderne.cartes }, graine, {
        j1: agent,
        j2: choisirActionBatchDeNuit,
      });
      if (fin.issue?.gagnant === 'j1') victoires += 1;
    }
    expect(victoires).toBeGreaterThanOrEqual(parties / 2);
  });
});
