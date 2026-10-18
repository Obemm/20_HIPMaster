import { randomInt, randomUUID } from 'node:crypto';
import {
  type Action,
  appliquer,
  creerPartie,
  DECKS_PRETES,
  type DeckPrete,
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

/** Le joueur humain est toujours j1, le bot j2 (ADR 0014). */
const HUMAIN = 'j1';
const BOT = 'j2';
/** Garde-fou : un tour du bot ne compte jamais autant d'actions. */
const ACTIONS_BOT_MAX = 200;

export interface OptionsDepot {
  /** Durée de vie d'une partie sans activité, en millisecondes (30 minutes par défaut). */
  dureeVieMs?: number;
  /** Nombre maximal de parties gardées (1 000 par défaut). */
  partiesMax?: number;
  /** Horloge, injectable pour les tests. */
  maintenant?: () => number;
  /** Graine de chaque nouvelle partie, injectable pour des parties reproductibles. */
  tirerGraine?: () => number;
}

interface Partie {
  id: string;
  etat: EtatPartie;
  deck: DeckPrete;
  deckBot: DeckPrete;
  niveau: NiveauBot;
  derniereActivite: number;
}

/** Réponse de l'API : la vue du joueur, sans son journal, et les événements à afficher. */
export interface PartieVisible {
  id: string;
  deck: string;
  deckAdversaire: string;
  /** Niveau du bot adverse (US-021). */
  niveau: string;
  vue: Omit<VueJoueur, 'journal'>;
  evenements: EntreeJournal[];
}

export type ResultatDepot<T> =
  | { ok: true; valeur: T }
  | { ok: false; raison: 'partie-inconnue' | 'deck-inconnu' | 'niveau-inconnu' }
  | { ok: false; raison: 'action-refusee'; erreur: ErreurAction };

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

/** Dépôt en mémoire des parties en cours (ADR 0014) : expiration et plafond. */
export class DepotParties {
  private readonly parties = new Map<string, Partie>();
  private readonly dureeVieMs: number;
  private readonly partiesMax: number;
  private readonly maintenant: () => number;
  private readonly tirerGraine: () => number;

  constructor(options: OptionsDepot = {}) {
    this.dureeVieMs = options.dureeVieMs ?? 30 * 60 * 1000;
    this.partiesMax = options.partiesMax ?? 1000;
    this.maintenant = options.maintenant ?? Date.now;
    this.tirerGraine = options.tirerGraine ?? (() => randomInt(0, 2 ** 31));
  }

  get taille(): number {
    return this.parties.size;
  }

  creer(idDeck: string, idNiveau: string = NIVEAU_PAR_DEFAUT): ResultatDepot<PartieVisible> {
    this.purger();
    const deck = trouverDeckPrete(idDeck);
    if (!deck) return { ok: false, raison: 'deck-inconnu' };
    const graine = this.tirerGraine();
    const deckBot = DECKS_PRETES[graine % DECKS_PRETES.length] ?? deck;
    const niveau = trouverNiveau(idNiveau);
    if (!niveau) return { ok: false, raison: 'niveau-inconnu' };
    const initial = creerPartie({ j1: deck.cartes, j2: deckBot.cartes }, graine);
    const etat = faireJouerLeBot(initial, niveau.strategie);
    this.faireDeLaPlace();
    const partie: Partie = {
      id: randomUUID(),
      etat,
      deck,
      deckBot,
      niveau,
      derniereActivite: this.maintenant(),
    };
    this.parties.set(partie.id, partie);
    return { ok: true, valeur: this.visible(partie, 0) };
  }

  lire(id: string): ResultatDepot<PartieVisible> {
    const partie = this.trouver(id);
    if (!partie) return { ok: false, raison: 'partie-inconnue' };
    return { ok: true, valeur: this.visible(partie, 0) };
  }

  jouer(id: string, action: Action): ResultatDepot<PartieVisible> {
    const partie = this.trouver(id);
    if (!partie) return { ok: false, raison: 'partie-inconnue' };
    const avant = partie.etat.journal.length;
    const resultat = appliquer(partie.etat, action);
    if (!resultat.ok) return { ok: false, raison: 'action-refusee', erreur: resultat.erreur };
    partie.etat = faireJouerLeBot(resultat.etat, partie.niveau.strategie);
    return { ok: true, valeur: this.visible(partie, avant) };
  }

  /** Trouve une partie encore valide et note l'activité. */
  private trouver(id: string): Partie | undefined {
    this.purger();
    const partie = this.parties.get(id);
    if (partie) partie.derniereActivite = this.maintenant();
    return partie;
  }

  private purger(): void {
    const limite = this.maintenant() - this.dureeVieMs;
    for (const [id, partie] of this.parties) {
      if (partie.derniereActivite < limite) this.parties.delete(id);
    }
  }

  /** Au plafond, retire la partie la moins récemment jouée. */
  private faireDeLaPlace(): void {
    while (this.parties.size >= this.partiesMax) {
      let plusAncienne: Partie | undefined;
      for (const partie of this.parties.values()) {
        if (!plusAncienne || partie.derniereActivite < plusAncienne.derniereActivite) {
          plusAncienne = partie;
        }
      }
      if (!plusAncienne) return;
      this.parties.delete(plusAncienne.id);
    }
  }

  /** La vue du joueur, et les événements visibles depuis l'index `depuis` du journal. */
  private visible(partie: Partie, depuis: number): PartieVisible {
    const { joueur, moi, adversaire, actif, tour, issue, actions } = vueDe(partie.etat, HUMAIN);
    return {
      id: partie.id,
      deck: partie.deck.id,
      deckAdversaire: partie.deckBot.id,
      niveau: partie.niveau.id,
      vue: { joueur, moi, adversaire, actif, tour, issue, actions },
      evenements: journalDe(partie.etat.journal.slice(depuis), HUMAIN),
    };
  }
}
