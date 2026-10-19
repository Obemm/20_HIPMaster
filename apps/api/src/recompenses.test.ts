import { randomUUID } from 'node:crypto';
import { choisirActionBatchDeNuit, type VueJoueur } from '@hipmaster/domain';
import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { construireApp } from './app.ts';
import { recompenserVictoire } from './comptes/boosters.ts';
import { creerJoueur } from './comptes/comptes.ts';
import { baseDeTest } from './db/base-de-test.ts';
import { joueurs } from './db/schema.ts';
import type { PartieVisible } from './parties/depot.ts';

const HEURE = 60 * 60 * 1000;
const ouverte = baseDeTest();
let maintenant: number;

beforeEach(() => {
  maintenant = Date.now();
});

const stock = async (id: string) =>
  (
    await ouverte.base
      .select({ boosters: joueurs.boosters })
      .from(joueurs)
      .where(eq(joueurs.id, id))
  )[0]?.boosters;

describe('récompense de victoire', () => {
  const options = () => ({ maintenant: () => maintenant });

  it('rapporte un booster, une seule fois par partie', async () => {
    const { joueur } = await creerJoueur(ouverte.base, 'Ada');
    const partie = randomUUID();
    expect(await recompenserVictoire(ouverte.base, partie, joueur.id, options())).toEqual({
      booster: true,
      plafondAtteint: false,
      motif: null,
    });
    expect(await recompenserVictoire(ouverte.base, partie, joueur.id, options())).toEqual({
      booster: true,
      plafondAtteint: false,
      motif: null,
    });
    expect(await stock(joueur.id)).toBe(6);
  });

  it('plafonne à 3 boosters par jour, puis recommence le lendemain', async () => {
    const { joueur } = await creerJoueur(ouverte.base, 'Ada');
    for (let i = 0; i < 3; i++) {
      const r = await recompenserVictoire(ouverte.base, randomUUID(), joueur.id, options());
      expect(r.booster).toBe(true);
    }
    expect(await recompenserVictoire(ouverte.base, randomUUID(), joueur.id, options())).toEqual({
      booster: false,
      plafondAtteint: true,
      motif: 'plafond',
    });
    expect(await stock(joueur.id)).toBe(8);

    maintenant += 24 * HEURE;
    const lendemain = await recompenserVictoire(ouverte.base, randomUUID(), joueur.id, options());
    expect(lendemain.booster).toBe(true);
  });

  it('peut faire dépasser le plafond de recharge', async () => {
    const { joueur } = await creerJoueur(ouverte.base, 'Ada');
    await ouverte.base.update(joueurs).set({ boosters: 10 }).where(eq(joueurs.id, joueur.id));
    await recompenserVictoire(ouverte.base, randomUUID(), joueur.id, options());
    expect(await stock(joueur.id)).toBe(11);
  });
});

describe('parties récompensées', () => {
  let app: ReturnType<typeof construireApp>;
  let graine: number;
  beforeEach(() => {
    graine = 0;
    app = construireApp({ base: ouverte.base, parties: { tirerGraine: () => ++graine } });
  });
  afterEach(async () => {
    await app.close();
  });

  /** Joue une partie complète avec la stratégie du Batch de nuit contre le Batch de nuit. */
  async function jouerPartie(entetes: Record<string, string>): Promise<PartieVisible> {
    let partie = (
      await app.inject({
        method: 'POST',
        url: '/api/v1/parties',
        headers: entetes,
        payload: { deck: 'moderne', niveau: 'batch-de-nuit' },
      })
    ).json<PartieVisible>();
    let actions = 0;
    while (!partie.vue.issue) {
      actions += 1;
      if (actions > 500) throw new Error('La partie ne se termine pas.');
      const vue: VueJoueur = { ...partie.vue, journal: [] };
      partie = (
        await app.inject({
          method: 'POST',
          url: `/api/v1/parties/${partie.id}/actions`,
          payload: choisirActionBatchDeNuit(vue),
        })
      ).json<PartieVisible>();
    }
    return partie;
  }

  it('une victoire en étant connecté rapporte un booster, annoncé dans la partie', async () => {
    const { joueur, jeton } = await creerJoueur(ouverte.base, 'Ada');
    const entetes = { authorization: `Bearer ${jeton}` };
    let partie = await jouerPartie(entetes);
    let essais = 0;
    while (partie.vue.issue?.gagnant !== partie.vue.joueur) {
      essais += 1;
      if (essais > 10) throw new Error('Aucune victoire en 10 parties.');
      expect(partie).not.toHaveProperty('recompense');
      partie = await jouerPartie(entetes);
    }
    expect(partie).toMatchObject({ recompense: { booster: true, plafondAtteint: false } });
    expect(await stock(joueur.id)).toBe(6);

    // Relire la partie terminée ne rapporte rien de plus.
    const relue = await app.inject({ method: 'GET', url: `/api/v1/parties/${partie.id}` });
    expect(relue.json()).toMatchObject({ recompense: { booster: true } });
    expect(await stock(joueur.id)).toBe(6);
  });

  it('une partie jouée sans compte ne rapporte rien', async () => {
    const partie = await jouerPartie({});
    expect(partie).not.toHaveProperty('recompense');
  });
});
