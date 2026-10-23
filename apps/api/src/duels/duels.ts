import { randomInt } from 'node:crypto';
import {
  type Action,
  appliquer,
  conceder,
  creerPartie,
  type EntreeJournal,
  type ErreurAction,
  type IdJoueur,
  journalDe,
  type DeckPrete,
  trouverDeckPrete,
  vueDe,
  type VueJoueur,
} from '@hipmaster/domain';
import { and, asc, desc, eq, gt, inArray, isNotNull, isNull, lt, ne, or, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { type OptionsBoosters, type Recompense, recompenserVictoire } from '../comptes/boosters.ts';
import type { Base } from '../db/index.ts';
import { duels, joueurs } from '../db/schema.ts';

/** Duels entre joueurs (US-032, ADR 0020) : l'état vit en base, chacun ne reçoit que sa vue. */

type LigneDuel = typeof duels.$inferSelect;
/** Une transaction ouverte sur la base. */
type Transaction = Parameters<Parameters<Base['transaction']>[0]>[0];
export type StatutDuel = LigneDuel['statut'];

export interface DuelVisible {
  id: string;
  statut: StatutDuel;
  version: number;
  createur: { pseudo: string };
  deckCreateur: string;
  /** Duel ouvert à tous (adversaire au hasard, US-037) ; sinon défi privé, rejoint par son lien. */
  ouvert: boolean;
  adversaire: { pseudo: string } | null;
  /** Le camp du joueur qui demande ; `null` s'il ne participe pas. */
  moi: IdJoueur | null;
  /** Longueur du journal : à repasser dans `depuis` pour ne recevoir que les nouveaux événements. */
  curseur: number;
  /** Duel en cours : instant limite du coup attendu, au-delà le joueur actif perd par forfait (US-036). */
  echeance: string | null;
  vue: Omit<VueJoueur, 'journal'> | null;
  evenements: EntreeJournal[];
  /** Duel gagné par le joueur qui demande : le booster gagné, ou pourquoi il ne l'est pas (US-038). */
  recompense?: Recompense;
}

export type ResultatDuel<T> =
  | { ok: true; valeur: T }
  | {
      ok: false;
      raison:
        | 'introuvable'
        | 'deck-inconnu'
        | 'deja-commence'
        | 'son-propre-duel'
        | 'pas-commence'
        | 'pas-ton-tour'
        | 'version-perimee'
        | 'expire'
        | 'deja-termine';
    }
  | { ok: false; raison: 'action-refusee'; erreur: ErreurAction };

export interface OptionsDuels {
  /** Graine de chaque duel, injectable pour des duels reproductibles. */
  tirerGraine?: () => number;
  /** Horloge, injectable pour les tests. */
  maintenant?: () => number;
  /** Durée de vie d'un défi non accepté (7 jours par défaut, US-033). */
  expirationDefiMs?: number;
  /** Délai pour jouer son coup ; au-delà, forfait (72 heures par défaut, US-036). */
  delaiTourMs?: number;
  /** Règles et horloge des boosters gagnés (US-038). */
  boosters?: OptionsBoosters;
}

/** Le pseudo affiché à la place d'un joueur qui a supprimé son compte (US-053, ADR 0031). */
export const COMPTE_SUPPRIME = 'Compte supprimé';

const SEPT_JOURS = 7 * 24 * 60 * 60 * 1000;
const SOIXANTE_DOUZE_HEURES = 72 * 60 * 60 * 1000;
const horloge = (options: OptionsDuels) => (options.maintenant ?? Date.now)();

/** Échéance du duel en cours : le délai de jeu, compté depuis le dernier coup (US-036). */
function echeanceDe(ligne: LigneDuel, options: OptionsDuels): Date | null {
  if (ligne.statut !== 'en-cours') return null;
  return new Date(ligne.majLe.getTime() + (options.delaiTourMs ?? SOIXANTE_DOUZE_HEURES));
}

/**
 * Applique le forfait d'un duel dont l'échéance est passée : le joueur actif perd. Évalué à la lecture, sans
 * tâche de fond (ADR 0020). La mise à jour est conditionnée à la version lue : si le duel a bougé entre-temps,
 * c'est la version en base qui fait foi.
 */
async function avecForfait(
  base: Base,
  ligne: LigneDuel,
  options: OptionsDuels,
): Promise<LigneDuel> {
  const echeance = echeanceDe(ligne, options);
  if (!echeance || !ligne.etat || horloge(options) <= echeance.getTime()) return ligne;
  const [maj] = await base
    .update(duels)
    .set({
      etat: conceder(ligne.etat, ligne.etat.actif, 'forfait'),
      statut: 'termine',
      version: ligne.version + 1,
      majLe: echeance,
    })
    .where(and(eq(duels.id, ligne.id), eq(duels.version, ligne.version)))
    .returning();
  if (maj) return maj;
  const [relue] = await base.select().from(duels).where(eq(duels.id, ligne.id));
  return relue ?? ligne;
}

/** Un défi non accepté expire (US-033) ; l'expiration est évaluée à la lecture, sans tâche de fond (ADR 0020). */
function defiExpire(ligne: LigneDuel, options: OptionsDuels): boolean {
  const maintenant = (options.maintenant ?? Date.now)();
  return (
    ligne.statut === 'attente' &&
    maintenant - ligne.creeLe.getTime() > (options.expirationDefiMs ?? SEPT_JOURS)
  );
}

const echec = <R extends Exclude<ResultatDuel<never>, { ok: true }>['raison']>(raison: R) =>
  ({ ok: false, raison }) as const;

/** Le camp d'un joueur dans un duel : le créateur joue j1, l'adversaire j2. */
function campDe(ligne: LigneDuel, joueurId: string): IdJoueur | null {
  if (ligne.createurId === joueurId) return 'j1';
  if (ligne.adversaireId === joueurId) return 'j2';
  return null;
}

async function pseudos(base: Base, ligne: LigneDuel): Promise<Map<string, string>> {
  const ids = [ligne.createurId, ligne.adversaireId].filter((id) => id !== null);
  const lignes = await base
    .select({ id: joueurs.id, pseudo: joueurs.pseudo })
    .from(joueurs)
    .where(inArray(joueurs.id, ids));
  return new Map(lignes.map((l) => [l.id, l.pseudo]));
}

/**
 * La récompense d'un duel gagné par `joueurId` (US-038), décidée une seule fois. Une victoire par abandon ou forfait
 * ne rapporte rien contre un adversaire déjà affronté le même jour (UTC), pour décourager les arrangements.
 */
async function recompenseDuel(
  base: Base,
  ligne: LigneDuel,
  joueurId: string,
  options: OptionsDuels,
): Promise<Recompense | undefined> {
  const issue = ligne.etat?.issue;
  const moi = campDe(ligne, joueurId);
  if (ligne.statut !== 'termine' || !issue || !moi || issue.gagnant !== moi) return undefined;
  const autre = moi === 'j1' ? ligne.adversaireId : ligne.createurId;
  let refus: 'adversaire-deja-affronte' | undefined;
  if (autre && (issue.raison === 'abandon' || issue.raison === 'forfait')) {
    const debutJour = new Date(horloge(options));
    debutJour.setUTCHours(0, 0, 0, 0);
    const [autreDuel] = await base
      .select({ id: duels.id })
      .from(duels)
      .where(
        and(
          ne(duels.id, ligne.id),
          gt(duels.creeLe, debutJour),
          or(
            and(eq(duels.createurId, joueurId), eq(duels.adversaireId, autre)),
            and(eq(duels.createurId, autre), eq(duels.adversaireId, joueurId)),
          ),
        ),
      )
      .limit(1);
    if (autreDuel) refus = 'adversaire-deja-affronte';
  }
  return recompenserVictoire(base, ligne.id, joueurId, options.boosters, refus);
}

/** L'adversaire d'un duel : `null` tant que personne ne l'a rejoint, « Compte supprimé » s'il est parti. */
function adversaireVisible(ligne: LigneDuel, noms: Map<string, string>): { pseudo: string } | null {
  if (ligne.statut === 'attente') return null;
  return { pseudo: (ligne.adversaireId && noms.get(ligne.adversaireId)) || COMPTE_SUPPRIME };
}

async function visible(
  base: Base,
  ligne: LigneDuel,
  joueurId: string,
  depuis: number,
  options: OptionsDuels = {},
): Promise<DuelVisible> {
  const noms = await pseudos(base, ligne);
  const moi = campDe(ligne, joueurId);
  const recompense = await recompenseDuel(base, ligne, joueurId, options);
  const etat = ligne.etat;
  let vue: DuelVisible['vue'] = null;
  if (etat && moi) {
    const { joueur, moi: camp, adversaire, actif, tour, issue, actions } = vueDe(etat, moi);
    vue = { joueur, moi: camp, adversaire, actif, tour, issue, actions };
  }
  return {
    id: ligne.id,
    statut: ligne.statut,
    version: ligne.version,
    createur: { pseudo: (ligne.createurId && noms.get(ligne.createurId)) || COMPTE_SUPPRIME },
    deckCreateur: ligne.deckCreateur,
    ouvert: ligne.ouvert,
    adversaire: adversaireVisible(ligne, noms),
    moi,
    curseur: etat?.journal.length ?? 0,
    echeance: echeanceDe(ligne, options)?.toISOString() ?? null,
    vue,
    evenements: etat && moi ? journalDe(etat.journal.slice(depuis), moi) : [],
    ...(recompense && { recompense }),
  };
}

export async function creerDuel(
  base: Base,
  joueurId: string,
  idDeck: string,
): Promise<ResultatDuel<DuelVisible>> {
  if (!trouverDeckPrete(idDeck)) return echec('deck-inconnu');
  const [ligne] = await base
    .insert(duels)
    .values({ createurId: joueurId, deckCreateur: idDeck })
    .returning();
  if (!ligne) throw new Error('Création du duel impossible.');
  return { ok: true, valeur: await visible(base, ligne, joueurId, 0) };
}

/**
 * Un participant voit le duel ; un autre joueur ne voit qu'un duel en attente (pour le rejoindre), jamais un duel
 * commencé.
 */
export async function lireDuel(
  base: Base,
  id: string,
  joueurId: string,
  depuis = 0,
  options: OptionsDuels = {},
): Promise<ResultatDuel<DuelVisible>> {
  const [lue] = await base.select().from(duels).where(eq(duels.id, id));
  if (!lue || (!campDe(lue, joueurId) && lue.statut !== 'attente')) {
    return echec('introuvable');
  }
  if (defiExpire(lue, options)) return echec('expire');
  const ligne = await avecForfait(base, lue, options);
  return { ok: true, valeur: await visible(base, ligne, joueurId, depuis, options) };
}

/** Lance un duel en attente (ligne déjà verrouillée) : la partie est créée, le tirage désigne qui commence. */
async function lancer(
  tx: Transaction,
  ligne: LigneDuel,
  joueurId: string,
  deck: DeckPrete,
  options: OptionsDuels,
): Promise<LigneDuel> {
  const deckCreateur = trouverDeckPrete(ligne.deckCreateur);
  if (!deckCreateur) throw new Error(`Deck du créateur inconnu : ${ligne.deckCreateur}`);
  const graine = (options.tirerGraine ?? (() => randomInt(0, 2 ** 31)))();
  const etat = creerPartie({ j1: deckCreateur.cartes, j2: deck.cartes }, graine);
  const [maj] = await tx
    .update(duels)
    .set({
      statut: 'en-cours',
      version: ligne.version + 1,
      adversaireId: joueurId,
      deckAdversaire: deck.id,
      etat,
      majLe: new Date(),
    })
    .where(eq(duels.id, ligne.id))
    .returning();
  if (!maj) throw new Error('Mise à jour du duel impossible.');
  return maj;
}

/** Le dernier joueur affronté, pour éviter de retomber sur lui au hasard (US-037). */
async function dernierAdversaire(tx: Transaction, joueurId: string): Promise<string | null> {
  const [dernier] = await tx
    .select({ createurId: duels.createurId, adversaireId: duels.adversaireId })
    .from(duels)
    .where(
      and(
        isNotNull(duels.adversaireId),
        or(eq(duels.createurId, joueurId), eq(duels.adversaireId, joueurId)),
      ),
    )
    .orderBy(desc(duels.majLe))
    .limit(1);
  if (!dernier) return null;
  return dernier.createurId === joueurId ? dernier.adversaireId : dernier.createurId;
}

/**
 * Adversaire au hasard (US-037) : rejoint le plus ancien duel ouvert d'un autre joueur (en évitant, si possible,
 * le dernier adversaire), ou ouvre un duel et attend. Un joueur déjà dans la file y garde sa place. `SKIP LOCKED` :
 * deux joueurs qui cherchent en même temps ne rejoignent jamais le même duel.
 */
export async function chercherAdversaire(
  base: Base,
  joueurId: string,
  idDeck: string,
  options: OptionsDuels = {},
): Promise<ResultatDuel<{ duel: DuelVisible; enAttente: boolean }>> {
  const deck = trouverDeckPrete(idDeck);
  if (!deck) return echec('deck-inconnu');
  const limite = new Date(horloge(options) - (options.expirationDefiMs ?? SEPT_JOURS));
  const ligne = await base.transaction(async (tx) => {
    const [dejaLa] = await tx
      .select()
      .from(duels)
      .where(
        and(
          eq(duels.createurId, joueurId),
          eq(duels.statut, 'attente'),
          eq(duels.ouvert, true),
          gt(duels.creeLe, limite),
        ),
      )
      .limit(1);
    if (dejaLa) return dejaLa;
    const dernier = await dernierAdversaire(tx, joueurId);
    const candidats = await tx
      .select()
      .from(duels)
      .where(
        and(
          eq(duels.statut, 'attente'),
          eq(duels.ouvert, true),
          ne(duels.createurId, joueurId),
          gt(duels.creeLe, limite),
        ),
      )
      .orderBy(asc(duels.creeLe))
      .limit(10)
      .for('update', { skipLocked: true });
    const choisi = candidats.find((c) => c.createurId !== dernier) ?? candidats[0];
    if (choisi) return lancer(tx, choisi, joueurId, deck, options);
    const [ouvert] = await tx
      .insert(duels)
      .values({ createurId: joueurId, deckCreateur: deck.id, ouvert: true })
      .returning();
    if (!ouvert) throw new Error('Création du duel impossible.');
    return ouvert;
  });
  return {
    ok: true,
    valeur: {
      duel: await visible(base, ligne, joueurId, 0, options),
      enAttente: ligne.statut === 'attente',
    },
  };
}

/** Rejoint un duel en attente : la partie est créée, le tirage désigne qui commence. */
export async function rejoindreDuel(
  base: Base,
  id: string,
  joueurId: string,
  idDeck: string,
  options: OptionsDuels = {},
): Promise<ResultatDuel<DuelVisible>> {
  const deck = trouverDeckPrete(idDeck);
  if (!deck) return echec('deck-inconnu');
  const resultat = await base.transaction(async (tx) => {
    const [ligne] = await tx.select().from(duels).where(eq(duels.id, id)).for('update');
    if (!ligne) return echec('introuvable');
    if (ligne.createurId === joueurId) return echec('son-propre-duel');
    if (ligne.statut !== 'attente') return echec('deja-commence');
    if (defiExpire(ligne, options)) return echec('expire');
    return { ok: true, valeur: await lancer(tx, ligne, joueurId, deck, options) } as const;
  });
  if (!resultat.ok) return resultat;
  return { ok: true, valeur: await visible(base, resultat.valeur, joueurId, 0, options) };
}

/**
 * Joue une action du joueur actif. `versionAttendue` (If-Match) refuse l'action si le duel a changé depuis ce que
 * le joueur a vu. La ligne est verrouillée : deux actions simultanées s'appliquent l'une après l'autre.
 */
export async function jouerDuel(
  base: Base,
  id: string,
  joueurId: string,
  action: Action,
  versionAttendue?: number,
  options: OptionsDuels = {},
): Promise<ResultatDuel<DuelVisible>> {
  // Un coup joué après l'échéance arrive trop tard : le forfait passe d'abord, l'action est alors refusée.
  const [lue] = await base.select().from(duels).where(eq(duels.id, id));
  if (lue && campDe(lue, joueurId)) await avecForfait(base, lue, options);
  const resultat = await base.transaction(async (tx) => {
    const [ligne] = await tx.select().from(duels).where(eq(duels.id, id)).for('update');
    const camp = ligne ? campDe(ligne, joueurId) : null;
    if (!ligne || !camp) return echec('introuvable');
    if (versionAttendue !== undefined && versionAttendue !== ligne.version) {
      return echec('version-perimee');
    }
    if (!ligne.etat) return echec('pas-commence');
    if (!ligne.etat.issue && ligne.etat.actif !== camp) return echec('pas-ton-tour');
    const avant = ligne.etat.journal.length;
    const applique = appliquer(ligne.etat, action);
    if (!applique.ok) {
      return { ok: false, raison: 'action-refusee', erreur: applique.erreur } as const;
    }
    const [maj] = await tx
      .update(duels)
      .set({
        etat: applique.etat,
        statut: applique.etat.issue ? 'termine' : 'en-cours',
        version: ligne.version + 1,
        majLe: new Date(),
      })
      .where(eq(duels.id, id))
      .returning();
    if (!maj) throw new Error('Mise à jour du duel impossible.');
    return { ok: true, valeur: { ligne: maj, avant } } as const;
  });
  if (!resultat.ok) return resultat;
  const { ligne, avant } = resultat.valeur;
  return { ok: true, valeur: await visible(base, ligne, joueurId, avant, options) };
}

/** Abandonne un duel en cours : l'adversaire gagne (US-036). */
export async function abandonnerDuel(
  base: Base,
  id: string,
  joueurId: string,
  options: OptionsDuels = {},
): Promise<ResultatDuel<DuelVisible>> {
  const resultat = await base.transaction(async (tx) => {
    const [ligne] = await tx.select().from(duels).where(eq(duels.id, id)).for('update');
    const camp = ligne ? campDe(ligne, joueurId) : null;
    if (!ligne || !camp) return echec('introuvable');
    if (!ligne.etat) return echec('pas-commence');
    if (ligne.etat.issue) return echec('deja-termine');
    const [maj] = await tx
      .update(duels)
      .set({
        etat: conceder(ligne.etat, camp, 'abandon'),
        statut: 'termine',
        version: ligne.version + 1,
        majLe: new Date(),
      })
      .where(eq(duels.id, id))
      .returning();
    if (!maj) throw new Error('Mise à jour du duel impossible.');
    return { ok: true, valeur: { ligne: maj, avant: ligne.etat.journal.length } } as const;
  });
  if (!resultat.ok) return resultat;
  const { ligne, avant } = resultat.valeur;
  return { ok: true, valeur: await visible(base, ligne, joueurId, avant, options) };
}

/** Annule un défi pas encore accepté : seul son créateur le peut (US-033). */
export async function annulerDuel(
  base: Base,
  id: string,
  joueurId: string,
): Promise<ResultatDuel<null>> {
  return base.transaction(async (tx) => {
    const [ligne] = await tx.select().from(duels).where(eq(duels.id, id)).for('update');
    if (!ligne || ligne.createurId !== joueurId) return echec('introuvable');
    if (ligne.statut !== 'attente') return echec('deja-commence');
    await tx.delete(duels).where(eq(duels.id, id));
    return { ok: true, valeur: null } as const;
  });
}

export interface ResumeDuel {
  id: string;
  statut: StatutDuel;
  adversaire: { pseudo: string } | null;
  monTour: boolean;
  tour: number | null;
  resultat: 'victoire' | 'defaite' | 'nulle' | null;
  /** Pour un duel terminé : comment il s'est fini (US-036). */
  raison: 'sla' | 'tours' | 'abandon' | 'forfait' | null;
  majLe: string;
  /** Pour un duel en cours : instant limite du coup attendu (US-036). */
  echeance: string | null;
}

const TERMINES_MAX = 20;
const ORDRE_GROUPE = { 'mon-tour': 0, 'son-tour': 1, attente: 2, termine: 3 } as const;

function groupeDe(statut: StatutDuel, monTour: boolean): keyof typeof ORDRE_GROUPE {
  if (statut === 'attente') return 'attente';
  if (statut === 'termine') return 'termine';
  return monTour ? 'mon-tour' : 'son-tour';
}

/** Le résultat d'un duel terminé, du point de vue du joueur (`gagnant` nul : égalité). */
function resultatDe(gagnant: string | null, moi: IdJoueur): NonNullable<ResumeDuel['resultat']> {
  if (gagnant === null) return 'nulle';
  return gagnant === moi ? 'victoire' : 'defaite';
}

/**
 * Les duels d'un joueur (US-035), ceux qui l'attendent en premier. Seuls le joueur actif, le tour et le gagnant
 * sont lus dans l'état du moteur (extraction JSON en base), pas l'état complet.
 */
export async function lireMesDuels(
  base: Base,
  joueurId: string,
  options: OptionsDuels = {},
): Promise<{ aMonTour: number; duels: ResumeDuel[] }> {
  // Les duels dont l'échéance est passée basculent d'abord en forfait (US-036).
  const delai = options.delaiTourMs ?? SOIXANTE_DOUZE_HEURES;
  const enRetard = await base
    .select()
    .from(duels)
    .where(
      and(
        eq(duels.statut, 'en-cours'),
        or(eq(duels.createurId, joueurId), eq(duels.adversaireId, joueurId)),
        lt(duels.majLe, new Date(horloge(options) - delai)),
      ),
    );
  for (const ligne of enRetard) await avecForfait(base, ligne, options);

  const createur = alias(joueurs, 'createur');
  const adversaire = alias(joueurs, 'adversaire');
  const lignes = await base
    .select({
      id: duels.id,
      statut: duels.statut,
      createurId: duels.createurId,
      pseudoCreateur: createur.pseudo,
      pseudoAdversaire: adversaire.pseudo,
      actif: sql<string | null>`${duels.etat}->>'actif'`,
      tour: sql<string | null>`${duels.etat}->>'tour'`,
      gagnant: sql<string | null>`${duels.etat}->'issue'->>'gagnant'`,
      raison: sql<ResumeDuel['raison']>`${duels.etat}->'issue'->>'raison'`,
      majLe: duels.majLe,
    })
    .from(duels)
    .leftJoin(createur, eq(createur.id, duels.createurId))
    .leftJoin(adversaire, eq(adversaire.id, duels.adversaireId))
    .where(or(eq(duels.createurId, joueurId), eq(duels.adversaireId, joueurId)))
    .orderBy(desc(duels.majLe));

  const resumes = lignes.map((l) => {
    const moi = l.createurId === joueurId ? 'j1' : 'j2';
    const pseudo =
      (moi === 'j1' ? l.pseudoAdversaire : l.pseudoCreateur) ??
      (l.statut === 'attente' ? null : COMPTE_SUPPRIME);
    const monTour = l.statut === 'en-cours' && l.actif === moi;
    const groupe = groupeDe(l.statut, monTour);
    const resultat = l.statut === 'termine' ? resultatDe(l.gagnant, moi) : null;
    const resume: ResumeDuel = {
      id: l.id,
      statut: l.statut,
      adversaire: pseudo ? { pseudo } : null,
      monTour,
      tour: l.tour === null ? null : Number(l.tour),
      resultat,
      raison: l.statut === 'termine' ? l.raison : null,
      majLe: l.majLe.toISOString(),
      echeance: l.statut === 'en-cours' ? new Date(l.majLe.getTime() + delai).toISOString() : null,
    };
    return { groupe, resume };
  });
  // Tri stable : l'ordre « plus récent d'abord » de la requête est gardé dans chaque groupe.
  resumes.sort((a, b) => ORDRE_GROUPE[a.groupe] - ORDRE_GROUPE[b.groupe]);
  const termines = resumes.filter((r) => r.groupe === 'termine').slice(0, TERMINES_MAX);
  const enCours = resumes.filter((r) => r.groupe !== 'termine');
  return {
    aMonTour: resumes.filter((r) => r.groupe === 'mon-tour').length,
    duels: [...enCours, ...termines].map((r) => r.resume),
  };
}

/**
 * Avant la suppression d'un compte (US-053, ADR 0031), dans sa transaction : ses duels en cours se terminent par
 * forfait (il perd), ses défis en attente disparaissent. Les lignes sont verrouillées comme pour une action : un coup
 * de l'adversaire joué au même instant passe avant ou après, jamais au milieu.
 */
export async function quitterSesDuels(tx: Transaction, joueurId: string): Promise<void> {
  const lignes = await tx
    .select()
    .from(duels)
    .where(
      and(
        ne(duels.statut, 'termine'),
        or(eq(duels.createurId, joueurId), eq(duels.adversaireId, joueurId)),
      ),
    )
    .for('update');
  for (const ligne of lignes) {
    const camp = campDe(ligne, joueurId);
    if (ligne.statut === 'attente' || !ligne.etat || !camp) {
      await tx.delete(duels).where(eq(duels.id, ligne.id));
      continue;
    }
    await tx
      .update(duels)
      .set({
        etat: conceder(ligne.etat, camp, 'forfait'),
        statut: 'termine',
        version: ligne.version + 1,
        majLe: new Date(),
      })
      .where(eq(duels.id, ligne.id));
  }
}

/** Après la suppression d'un compte : un duel dont les deux joueurs sont partis ne sert plus à personne. */
export async function oublierDuelsSansJoueur(tx: Transaction): Promise<void> {
  await tx.delete(duels).where(and(isNull(duels.createurId), isNull(duels.adversaireId)));
}
