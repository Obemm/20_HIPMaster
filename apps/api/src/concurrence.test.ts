import { randomUUID } from 'node:crypto';
import { REGLES_BOOSTERS, TAILLE_BOOSTER } from '@hipmaster/domain';
import { eq, sql, sum } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { type OptionsBoosters, ouvrirUnBooster, recompenserVictoire } from './comptes/boosters.ts';
import { creerJoueur } from './comptes/comptes.ts';
import { baseDeTest } from './db/base-de-test.ts';
import { collection, duels, joueurs, recompenses } from './db/schema.ts';
import { chercherAdversaire, creerDuel, jouerDuel, rejoindreDuel } from './duels/duels.ts';

/**
 * Opérations lancées en même temps (US-056). PGlite exécute les requêtes une par une : là, ces tests ne prouvent que la
 * logique. Sur PostgreSQL (`DATABASE_URL`, job « API sur PostgreSQL » de la CI), chaque opération prend sa propre
 * connexion du pool et elles se chevauchent vraiment : ce sont alors les verrous qui sont mis à l'épreuve.
 */
const ouverte = baseDeTest();
const FOIS = 10;

/**
 * Lance `FOIS` fois l'opération en même temps. Le pool ouvre d'abord ses connexions : sinon, il les ouvre une à une, et
 * la première opération finit souvent avant que la deuxième ne commence.
 */
async function enParallele<T>(operation: (i: number) => Promise<T>): Promise<T[]> {
  await Promise.all(Array.from({ length: FOIS }, () => ouverte.base.execute(sql`select 1`)));
  return Promise.all(Array.from({ length: FOIS }, (_, i) => operation(i)));
}

/** Un joueur neuf (5 boosters offerts), et une horloge calée sur sa création : aucune recharge pendant le test. */
async function joueurSansRecharge(pseudo: string) {
  const { joueur } = await creerJoueur(ouverte.base, pseudo);
  const [ligne] = await ouverte.base
    .select({ depuis: joueurs.rechargeDepuis })
    .from(joueurs)
    .where(eq(joueurs.id, joueur.id));
  const depuis = ligne?.depuis.getTime() ?? Date.now();
  const options: OptionsBoosters = { maintenant: () => depuis };
  return { id: joueur.id, options };
}

async function stock(joueurId: string) {
  const [ligne] = await ouverte.base
    .select({ boosters: joueurs.boosters })
    .from(joueurs)
    .where(eq(joueurs.id, joueurId));
  return ligne?.boosters;
}

describe('opérations simultanées (US-056)', () => {
  it('des ouvertures de booster simultanées ne consomment chaque booster qu’une fois', async () => {
    const ada = await joueurSansRecharge('Ada');
    const ouvertures = await enParallele(() => ouvrirUnBooster(ouverte.base, ada.id, ada.options));

    expect(ouvertures.filter((o) => o !== null)).toHaveLength(REGLES_BOOSTERS.bienvenue);
    expect(await stock(ada.id)).toBe(0);
    const [cartes] = await ouverte.base
      .select({ total: sum(collection.exemplaires).mapWith(Number) })
      .from(collection)
      .where(eq(collection.joueurId, ada.id));
    expect(cartes?.total).toBe(REGLES_BOOSTERS.bienvenue * TAILLE_BOOSTER);
  });

  it('une même victoire récompensée plusieurs fois en même temps ne rapporte qu’un booster', async () => {
    const ada = await joueurSansRecharge('Ada');
    const partie = randomUUID();
    const decisions = await enParallele(() =>
      recompenserVictoire(ouverte.base, partie, ada.id, ada.options),
    );

    for (const decision of decisions) {
      expect(decision).toEqual({ booster: true, plafondAtteint: false, motif: null });
    }
    expect(await stock(ada.id)).toBe(REGLES_BOOSTERS.bienvenue + 1);
    const lignes = await ouverte.base
      .select()
      .from(recompenses)
      .where(eq(recompenses.partieId, partie));
    expect(lignes).toHaveLength(1);
  });

  it('des victoires simultanées respectent le plafond quotidien de boosters', async () => {
    const ada = await joueurSansRecharge('Ada');
    const decisions = await enParallele(() =>
      recompenserVictoire(ouverte.base, randomUUID(), ada.id, ada.options),
    );

    expect(decisions.filter((d) => d.booster)).toHaveLength(REGLES_BOOSTERS.victoiresParJour);
    expect(decisions.filter((d) => d.motif === 'plafond')).toHaveLength(
      FOIS - REGLES_BOOSTERS.victoiresParJour,
    );
    expect(await stock(ada.id)).toBe(REGLES_BOOSTERS.bienvenue + REGLES_BOOSTERS.victoiresParJour);
  });

  it('des joueurs qui cherchent un adversaire en même temps ne rejoignent jamais le même duel', async () => {
    const ada = await creerJoueur(ouverte.base, 'Ada');
    expect((await chercherAdversaire(ouverte.base, ada.joueur.id, 'moderne')).ok).toBe(true);
    const enFile = await enParallele((i) => creerJoueur(ouverte.base, `Joueur ${i}`));

    const resultats = await Promise.all(
      enFile.map(({ joueur }) => chercherAdversaire(ouverte.base, joueur.id, 'heritage')),
    );

    const rejoints = resultats.flatMap((r) =>
      r.ok && !r.valeur.enAttente ? [r.valeur.duel.id] : [],
    );
    expect(rejoints.length).toBeGreaterThan(0);
    expect(new Set(rejoints).size).toBe(rejoints.length);
    // Chacun est dans un duel et un seul, qu'il l'ait créé (et y attende) ou rejoint.
    const lignes = await ouverte.base.select().from(duels);
    const participants = lignes.flatMap((l) => [l.createurId, l.adversaireId ?? []].flat());
    expect(participants).toHaveLength(FOIS + 1);
    expect(new Set(participants).size).toBe(FOIS + 1);
    // Le duel ouvert d'Ada a trouvé exactement un adversaire.
    const chezAda = lignes.filter((l) => l.createurId === ada.joueur.id);
    expect(chezAda).toHaveLength(1);
    expect(chezAda[0]?.statut).toBe('en-cours');
  });

  describe('actions simultanées dans un duel', () => {
    /** Un duel lancé entre Ada et Bob ; renvoie aussi le joueur dont c'est le tour. */
    async function duelLance() {
      const ada = await creerJoueur(ouverte.base, 'Ada');
      const bob = await creerJoueur(ouverte.base, 'Bob');
      const cree = await creerDuel(ouverte.base, ada.joueur.id, 'moderne');
      if (!cree.ok) throw new Error('Duel non créé.');
      const lance = await rejoindreDuel(ouverte.base, cree.valeur.id, bob.joueur.id, 'heritage');
      if (!lance.ok || !lance.valeur.vue) throw new Error('Duel non lancé.');
      const actif = lance.valeur.vue.actif === 'j1' ? ada.joueur.id : bob.joueur.id;
      return { id: cree.valeur.id, actif, version: lance.valeur.version };
    }

    async function versionEnBase(id: string) {
      const [ligne] = await ouverte.base
        .select({ version: duels.version })
        .from(duels)
        .where(eq(duels.id, id));
      return ligne?.version;
    }

    it('avec la même version attendue (If-Match), une seule s’applique', async () => {
      const { id, actif, version } = await duelLance();
      const resultats = await enParallele(() =>
        jouerDuel(ouverte.base, id, actif, { type: 'finirTour' }, version),
      );

      expect(resultats.filter((r) => r.ok)).toHaveLength(1);
      expect(resultats.flatMap((r) => (r.ok ? [] : [r.raison]))).toEqual(
        Array.from({ length: FOIS - 1 }, () => 'version-perimee'),
      );
      expect(await versionEnBase(id)).toBe(version + 1);
    });

    it('sans version attendue, la même fin de tour ne passe pas deux tours', async () => {
      const { id, actif, version } = await duelLance();
      const resultats = await enParallele(() =>
        jouerDuel(ouverte.base, id, actif, { type: 'finirTour' }),
      );

      expect(resultats.filter((r) => r.ok)).toHaveLength(1);
      expect(resultats.flatMap((r) => (r.ok ? [] : [r.raison]))).toEqual(
        Array.from({ length: FOIS - 1 }, () => 'pas-ton-tour'),
      );
      expect(await versionEnBase(id)).toBe(version + 1);
    });
  });
});
