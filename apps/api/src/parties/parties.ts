import { randomInt } from 'node:crypto';
import {
  type Action,
  appliquer,
  creerPartie,
  DECKS_PRETES,
  type EntreeJournal,
  type ErreurAction,
  type EtatPartie,
  journalDe,
  NIVEAU_PAR_DEFAUT,
  type NiveauBot,
  trouverDeckPrete,
  trouverNiveau,
  vueDe,
  type VueJoueur,
} from '@hipmaster/domain';
import { and, asc, eq, inArray, lt, sql } from 'drizzle-orm';
import type { Base } from '../db/index.ts';
import { parties } from '../db/schema.ts';

/** Parties contre le bot (US-052, ADR 0030) : l'état vit en base, le joueur ne reçoit que sa vue. */

type LignePartie = typeof parties.$inferSelect;

/** Le joueur humain est toujours j1, le bot j2 (ADR 0030). */
const HUMAIN = 'j1';
const BOT = 'j2';
/** Garde-fou : un tour du bot ne compte jamais autant d'actions. */
const ACTIONS_BOT_MAX = 200;
const VINGT_QUATRE_HEURES = 24 * 60 * 60 * 1000;
/** Un identifiant qui n'est pas un UUID ne désigne aucune partie : inutile de le soumettre à la base. */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface OptionsParties {
  /** Durée de vie d'une partie sans coup joué, en millisecondes (24 heures par défaut). */
  dureeVieMs?: number;
  /** Nombre maximal de parties gardées (1 000 par défaut). */
  partiesMax?: number;
  /** Horloge, injectable pour les tests. */
  maintenant?: () => number;
  /** Graine de chaque nouvelle partie, injectable pour des parties reproductibles. */
  tirerGraine?: () => number;
}

/** Le joueur connecté qui a lancé une partie, et la session d'où il l'a lancée. */
export interface Proprietaire {
  /** Il recevra la récompense d'une victoire (US-025). */
  joueurId: string;
  /** Empreinte du jeton de la session : seule cette session lit et joue la partie (US-047, ADR 0025). */
  session: string;
}

/** Réponse de l'API : la vue du joueur, sans son journal, et les événements à afficher. */
export interface PartieVisible {
  id: string;
  /** Change à chaque action (If-Match, ADR 0030). */
  version: number;
  deck: string;
  deckAdversaire: string;
  /** Niveau du bot adverse (US-021). */
  niveau: string;
  vue: Omit<VueJoueur, 'journal'>;
  evenements: EntreeJournal[];
}

/** Une partie, et le joueur connecté qui l'a lancée (`null` pour une partie anonyme). */
export interface PartieLue {
  partie: PartieVisible;
  joueurId: string | null;
}

export type ResultatPartie<T> =
  | { ok: true; valeur: T }
  | { ok: false; raison: 'partie-inconnue' | 'deck-inconnu' | 'niveau-inconnu' | 'version-perimee' }
  | { ok: false; raison: 'action-refusee'; erreur: ErreurAction };

const horloge = (options: OptionsParties) => (options.maintenant ?? Date.now)();
const echec = <R extends Exclude<ResultatPartie<never>, { ok: true }>['raison']>(raison: R) =>
  ({ ok: false, raison }) as const;

/** Le niveau d'une partie ; celui par défaut si le niveau gardé n'existe plus. */
function niveauDe(ligne: LignePartie): NiveauBot {
  const niveau = trouverNiveau(ligne.niveau) ?? trouverNiveau(NIVEAU_PAR_DEFAUT);
  if (!niveau) throw new Error(`Niveau inconnu : ${ligne.niveau}`);
  return niveau;
}

/** Fait jouer le bot tant que c'est son tour. */
function faireJouerLeBot(etat: EtatPartie, strategie: NiveauBot['strategie']): EtatPartie {
  let courant = etat;
  let actions = 0;
  while (!courant.issue && courant.actif === BOT) {
    actions += 1;
    if (actions > ACTIONS_BOT_MAX) throw new Error('Le bot ne termine pas son tour.');
    const resultat = appliquer(courant, strategie(vueDe(courant, BOT)));
    if (!resultat.ok) throw new Error(`Action illégale du bot : ${resultat.erreur.message}`);
    courant = resultat.etat;
  }
  return courant;
}

/** La vue du joueur, et les événements visibles depuis l'index `depuis` du journal. */
function visible(
  ligne: Pick<LignePartie, 'id' | 'version' | 'deck' | 'deckBot' | 'niveau' | 'etat'>,
  depuis: number,
): PartieVisible {
  const { joueur, moi, adversaire, actif, tour, issue, actions } = vueDe(ligne.etat, HUMAIN);
  return {
    id: ligne.id,
    version: ligne.version,
    deck: ligne.deck,
    deckAdversaire: ligne.deckBot,
    niveau: ligne.niveau,
    vue: { joueur, moi, adversaire, actif, tour, issue, actions },
    evenements: journalDe(ligne.etat.journal.slice(depuis), HUMAIN),
  };
}

/**
 * Avant une création : supprime les parties expirées, puis, au plafond, la partie anonyme la moins récemment jouée,
 * et seulement à défaut celle d'un joueur connecté (ADR 0025) : un afflux de parties anonymes ne fait pas perdre la
 * sienne à un joueur connecté. Deux créations simultanées peuvent supprimer une partie de trop : sans conséquence.
 */
async function faireDeLaPlace(base: Base, options: OptionsParties): Promise<void> {
  const dureeVie = options.dureeVieMs ?? VINGT_QUATRE_HEURES;
  await base.delete(parties).where(lt(parties.majLe, new Date(horloge(options) - dureeVie)));
  const surplus = (await base.$count(parties)) - (options.partiesMax ?? 1000) + 1;
  if (surplus <= 0) return;
  const plusAnciennes = base
    .select({ id: parties.id })
    .from(parties)
    .orderBy(sql`${parties.joueurId} is not null`, asc(parties.majLe))
    .limit(surplus);
  await base.delete(parties).where(inArray(parties.id, plusAnciennes));
}

/** Crée une partie ; si le bot commence, son premier tour est déjà joué. */
export async function lancerPartie(
  base: Base,
  idDeck: string,
  idNiveau: string = NIVEAU_PAR_DEFAUT,
  proprietaire: Proprietaire | null = null,
  options: OptionsParties = {},
): Promise<ResultatPartie<PartieVisible>> {
  const deck = trouverDeckPrete(idDeck);
  if (!deck) return echec('deck-inconnu');
  const niveau = trouverNiveau(idNiveau);
  if (!niveau) return echec('niveau-inconnu');
  const graine = (options.tirerGraine ?? (() => randomInt(0, 2 ** 31)))();
  const deckBot = DECKS_PRETES[graine % DECKS_PRETES.length] ?? deck;
  const initial = creerPartie({ j1: deck.cartes, j2: deckBot.cartes }, graine);
  const etat = faireJouerLeBot(initial, niveau.strategie);
  await faireDeLaPlace(base, options);
  const maintenant = new Date(horloge(options));
  const [ligne] = await base
    .insert(parties)
    .values({
      joueurId: proprietaire?.joueurId ?? null,
      session: proprietaire?.session ?? null,
      deck: deck.id,
      deckBot: deckBot.id,
      niveau: niveau.id,
      etat,
      creeLe: maintenant,
      majLe: maintenant,
    })
    .returning({ id: parties.id, version: parties.version });
  if (!ligne) throw new Error('Création de la partie impossible.');
  return {
    ok: true,
    valeur: visible({ ...ligne, deck: deck.id, deckBot: deckBot.id, niveau: niveau.id, etat }, 0),
  };
}

/**
 * La partie encore valide, visible de cette session : une partie expirée (ADR 0030), ou celle d'un joueur connecté
 * demandée par une autre session (ADR 0025), est inconnue. `session` : empreinte du jeton (`null` sans jeton).
 */
async function trouver(
  base: Base,
  id: string,
  session: string | null,
  options: OptionsParties,
): Promise<LignePartie | undefined> {
  if (!UUID.test(id)) return undefined;
  const [ligne] = await base.select().from(parties).where(eq(parties.id, id));
  if (!ligne || (ligne.session !== null && ligne.session !== session)) return undefined;
  const dureeVie = options.dureeVieMs ?? VINGT_QUATRE_HEURES;
  if (horloge(options) - ligne.majLe.getTime() > dureeVie) return undefined;
  return ligne;
}

/** Lit la partie, sans compter comme une activité. */
export async function lirePartie(
  base: Base,
  id: string,
  session: string | null,
  options: OptionsParties = {},
): Promise<ResultatPartie<PartieLue>> {
  const ligne = await trouver(base, id, session, options);
  if (!ligne) return echec('partie-inconnue');
  return { ok: true, valeur: { partie: visible(ligne, 0), joueurId: ligne.joueurId } };
}

/**
 * Joue une action du joueur, puis tout le tour du bot, et écrit le tout en une seule fois, à condition que la partie
 * n'ait pas changé depuis sa lecture (ADR 0030) : de deux actions simultanées, une seule passe, l'autre est refusée
 * (`version-perimee`). `versionAttendue` (If-Match) refuse d'emblée une action fondée sur une version dépassée.
 */
export async function jouerPartie(
  base: Base,
  id: string,
  action: Action,
  session: string | null,
  versionAttendue?: number,
  options: OptionsParties = {},
): Promise<ResultatPartie<PartieLue>> {
  const ligne = await trouver(base, id, session, options);
  if (!ligne) return echec('partie-inconnue');
  if (versionAttendue !== undefined && versionAttendue !== ligne.version) {
    return echec('version-perimee');
  }
  const avant = ligne.etat.journal.length;
  const applique = appliquer(ligne.etat, action);
  if (!applique.ok) return { ok: false, raison: 'action-refusee', erreur: applique.erreur };
  const etat = faireJouerLeBot(applique.etat, niveauDe(ligne).strategie);
  const [maj] = await base
    .update(parties)
    .set({ etat, version: ligne.version + 1, majLe: new Date(horloge(options)) })
    .where(and(eq(parties.id, id), eq(parties.version, ligne.version)))
    .returning({ version: parties.version });
  if (!maj) return echec('version-perimee');
  return {
    ok: true,
    valeur: {
      partie: visible({ ...ligne, version: maj.version, etat }, avant),
      joueurId: ligne.joueurId,
    },
  };
}
