import {
  cotesApresDuel,
  pointsVictoireBot,
  REGLES_SCORE,
  type ReglesScore,
} from '@hipmaster/domain';
import { and, asc, count, desc, eq, gt, gte, inArray, isNull, lt, sql } from 'drizzle-orm';
import type { Base } from '../db/index.ts';
import { duels, joueurs, points, recompenses } from '../db/schema.ts';

/**
 * Score et classement (US-069, ADR 0044). Le serveur seul compte les points (ADR 0004) : une victoire contre le bot
 * selon le niveau, une victoire ou un nul en duel, au plus `victoiresCompteesParJour` victoires par jour UTC. La cote
 * de duel suit chaque duel terminé entre deux comptes encore présents. Rien n'est jamais remis à zéro.
 */

export interface OptionsScores {
  regles?: ReglesScore;
  /** Horloge, injectable pour les tests. */
  maintenant?: () => number;
}

type Transaction = Parameters<Parameters<Base['transaction']>[0]>[0];

const debutDuJour = (instant: Date): Date => {
  const debut = new Date(instant);
  debut.setUTCHours(0, 0, 0, 0);
  return debut;
};

/**
 * Inscrit un gain au registre et l'ajoute au score, une seule fois par partie et par joueur. Une victoire au-delà du
 * plafond du jour (celui de `le`) s'inscrit à 0 point. Le verrou du joueur sérialise ses gains.
 */
async function crediter(
  tx: Transaction,
  gain: { partieId: string; joueurId: string; points: number; victoire: boolean; le: Date },
  regles: ReglesScore,
): Promise<number> {
  const [joueur] = await tx
    .select({ id: joueurs.id })
    .from(joueurs)
    .where(eq(joueurs.id, gain.joueurId))
    .for('update');
  if (!joueur) return 0;
  const [deja] = await tx
    .select({ points: points.points })
    .from(points)
    .where(and(eq(points.partieId, gain.partieId), eq(points.joueurId, gain.joueurId)));
  if (deja) return deja.points;

  let gagnes = gain.points;
  if (gain.victoire) {
    const debut = debutDuJour(gain.le);
    const fin = new Date(debut.getTime() + 24 * 60 * 60 * 1000);
    const [{ comptees } = { comptees: 0 }] = await tx
      .select({ comptees: count() })
      .from(points)
      .where(
        and(
          eq(points.joueurId, gain.joueurId),
          eq(points.victoire, true),
          gt(points.points, 0),
          gte(points.gagneLe, debut),
          lt(points.gagneLe, fin),
        ),
      );
    if (comptees >= regles.victoiresCompteesParJour) gagnes = 0;
  }
  await tx.insert(points).values({ ...gain, points: gagnes, gagneLe: gain.le });
  if (gagnes > 0) {
    await tx
      .update(joueurs)
      .set({ points: sql`${joueurs.points} + ${gagnes}` })
      .where(eq(joueurs.id, gain.joueurId));
  }
  return gagnes;
}

/** Compte une victoire contre le bot de ce niveau ; renvoie les points gagnés (les mêmes si elle l'était déjà). */
export async function compterVictoireBot(
  base: Base,
  partieId: string,
  joueurId: string,
  niveau: string,
  options: OptionsScores = {},
): Promise<number> {
  const regles = options.regles ?? REGLES_SCORE;
  const le = new Date((options.maintenant ?? Date.now)());
  return base.transaction((tx) =>
    crediter(
      tx,
      { partieId, joueurId, points: pointsVictoireBot(niveau, regles), victoire: true, le },
      regles,
    ),
  );
}

/**
 * Compte un duel terminé, une seule fois (`scoreCompte`) : les points du gagnant ou du nul, au jour de la fin du duel,
 * et les deux cotes si les deux comptes existent encore. Sans effet sur un duel en cours ou déjà compté.
 */
export async function compterDuel(
  base: Base,
  duelId: string,
  options: OptionsScores = {},
): Promise<void> {
  const regles = options.regles ?? REGLES_SCORE;
  await base.transaction(async (tx) => {
    const [duel] = await tx
      .update(duels)
      .set({ scoreCompte: true })
      .where(and(eq(duels.id, duelId), eq(duels.statut, 'termine'), eq(duels.scoreCompte, false)))
      .returning({
        j1: duels.createurId,
        j2: duels.adversaireId,
        // 'j1', 'j2' ou 'nul' ; sans issue (ce qui ne devrait pas arriver), rien à compter.
        issue: sql<
          'j1' | 'j2' | 'nul' | null
        >`case when jsonb_typeof(${duels.etat}->'issue') = 'object'
          then coalesce(${duels.etat}->'issue'->>'gagnant', 'nul') end`,
        le: duels.majLe,
      });
    if (!duel?.issue) return;
    const { j1, j2, issue, le } = duel;

    if (issue === 'nul') {
      for (const joueurId of [j1, j2]) {
        if (joueurId) {
          await crediter(
            tx,
            { partieId: duelId, joueurId, points: regles.nulDuel, victoire: false, le },
            regles,
          );
        }
      }
    } else {
      const gagnant = issue === 'j1' ? j1 : j2;
      if (gagnant) {
        await crediter(
          tx,
          { partieId: duelId, joueurId: gagnant, points: regles.victoireDuel, victoire: true, le },
          regles,
        );
      }
    }

    if (!j1 || !j2) return;
    // Verrous dans un ordre fixe : deux duels comptés en même temps entre les mêmes joueurs ne s'attendent pas l'un
    // l'autre indéfiniment.
    const cotes = await tx
      .select({ id: joueurs.id, cote: joueurs.cote })
      .from(joueurs)
      .where(inArray(joueurs.id, [j1, j2]))
      .orderBy(asc(joueurs.id))
      .for('update');
    const coteDe = (id: string) => cotes.find((c) => c.id === id)?.cote ?? regles.coteInitiale;
    const resultat = { nul: 0.5, j1: 1, j2: 0 } as const;
    const [c1, c2] = cotesApresDuel(coteDe(j1), coteDe(j2), resultat[issue], regles);
    for (const [id, cote] of [
      [j1, c1],
      [j2, c2],
    ] as const) {
      await tx
        .update(joueurs)
        .set({ cote, duelsCotes: sql`${joueurs.duelsCotes} + 1` })
        .where(eq(joueurs.id, id));
    }
  });
}

/** Ce que le rattrapage a compté. */
export interface BilanRattrapage {
  victoiresBot: number;
  duels: number;
}

/** Une victoire contre le bot récompensée depuis moins longtemps est encore en train d'être comptée. */
const DELAI_RATTRAPAGE_MS = 60 * 60 * 1000;

/**
 * Compte ce qui ne l'est pas encore, dans l'ordre chronologique (ADR 0044) : les victoires contre le bot d'avant le
 * score (récompensées, mais sans niveau connu : `victoireBotSansNiveau`), puis les duels terminés. Lancé par la
 * commande de migration, par la purge de chaque nuit, et au démarrage de l'API de développement.
 */
export async function rattraperScores(
  base: Base,
  options: OptionsScores = {},
): Promise<BilanRattrapage> {
  const regles = options.regles ?? REGLES_SCORE;
  const avant = new Date((options.maintenant ?? Date.now)() - DELAI_RATTRAPAGE_MS);
  const victoires = await base
    .select({
      partieId: recompenses.partieId,
      joueurId: recompenses.joueurId,
      le: recompenses.accordeeLe,
    })
    .from(recompenses)
    .leftJoin(duels, eq(duels.id, recompenses.partieId))
    .leftJoin(
      points,
      and(eq(points.partieId, recompenses.partieId), eq(points.joueurId, recompenses.joueurId)),
    )
    .where(and(isNull(duels.id), isNull(points.partieId), lt(recompenses.accordeeLe, avant)))
    .orderBy(asc(recompenses.accordeeLe));
  for (const victoire of victoires) {
    await base.transaction((tx) =>
      crediter(tx, { ...victoire, points: regles.victoireBotSansNiveau, victoire: true }, regles),
    );
  }

  const aCompter = await base
    .select({ id: duels.id })
    .from(duels)
    .where(and(eq(duels.statut, 'termine'), eq(duels.scoreCompte, false)))
    .orderBy(asc(duels.majLe));
  for (const { id } of aCompter) await compterDuel(base, id, options);
  return { victoiresBot: victoires.length, duels: aCompter.length };
}

/** Le score d'un joueur ; `cote` vaut `null` tant qu'aucun duel n'est compté. */
export interface Score {
  pseudo: string;
  points: number;
  cote: number | null;
}

export interface Classement {
  /** Le joueur connecté : `rang` vaut `null` s'il s'est retiré du classement ou n'a encore aucun point. */
  moi: Score & { rang: number | null; classe: boolean };
  /** Les joueurs classés qui ont au moins un point, du meilleur score au plus petit. */
  joueurs: (Score & { rang: number; moi: boolean })[];
}

/** Joueurs montrés au plus dans le classement. */
export const TAILLE_CLASSEMENT = 100;

const coteVisible = (ligne: { cote: number; duelsCotes: number }) =>
  ligne.duelsCotes > 0 ? ligne.cote : null;

/** Le classement vu par un joueur : son score, son rang, et les meilleurs joueurs classés. */
export async function lireClassement(base: Base, joueurId: string): Promise<Classement | null> {
  const [moi] = await base
    .select({
      pseudo: joueurs.pseudo,
      points: joueurs.points,
      cote: joueurs.cote,
      duelsCotes: joueurs.duelsCotes,
      classe: joueurs.classe,
    })
    .from(joueurs)
    .where(eq(joueurs.id, joueurId));
  if (!moi) return null;

  let rang: number | null = null;
  if (moi.classe && moi.points > 0) {
    const [{ devant } = { devant: 0 }] = await base
      .select({ devant: count() })
      .from(joueurs)
      .where(and(eq(joueurs.classe, true), gt(joueurs.points, moi.points)));
    rang = devant + 1;
  }

  const lignes = await base
    .select({
      id: joueurs.id,
      pseudo: joueurs.pseudo,
      points: joueurs.points,
      cote: joueurs.cote,
      duelsCotes: joueurs.duelsCotes,
      rang: sql<number>`rank() over (order by ${joueurs.points} desc)`.mapWith(Number),
    })
    .from(joueurs)
    .where(and(eq(joueurs.classe, true), gt(joueurs.points, 0)))
    .orderBy(desc(joueurs.points), asc(joueurs.pseudo))
    .limit(TAILLE_CLASSEMENT);

  return {
    moi: {
      pseudo: moi.pseudo,
      points: moi.points,
      cote: coteVisible(moi),
      rang,
      classe: moi.classe,
    },
    joueurs: lignes.map((l) => ({
      rang: l.rang,
      pseudo: l.pseudo,
      points: l.points,
      cote: coteVisible(l),
      moi: l.id === joueurId,
    })),
  };
}

/** Se retirer du classement, ou y revenir : le score continue de compter. */
export async function changerClassement(
  base: Base,
  joueurId: string,
  classe: boolean,
): Promise<void> {
  await base.update(joueurs).set({ classe }).where(eq(joueurs.id, joueurId));
}
