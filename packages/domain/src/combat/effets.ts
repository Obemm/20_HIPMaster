import { tirerIndex } from './alea.ts';
import { attaqueForcee, blesser, resoudreDestructions } from './combat.ts';
import {
  adversaire,
  carteDe,
  erreur,
  noter,
  nouveauComposant,
  PLATEAU_MAX,
  possede,
} from './outils.ts';
import { aCapacite, estPriseEnCharge } from './prise-en-charge.ts';
import { coutEffectif, consommerCache } from './ia.ts';
import { piocher } from './tour.ts';
import type {
  Cible,
  ComposantEnJeu,
  ErreurAction,
  EtatPartie,
  IdJoueur,
  InstanceCarte,
  Statut,
} from './types.ts';

/** Le contexte d'un sort ou d'un incident : la partie, le joueur qui le joue et son adversaire. */
interface Contexte {
  etat: EtatPartie;
  joueur: IdJoueur;
  adverse: IdJoueur;
}

/** Où chercher une cible : mon plateau, le plateau adverse, ma défausse, ou le camp de la cible précédente. */
type Zone = 'allie' | 'adverse' | 'defausse' | 'camp-precedent';

interface SpecCible {
  zone: Zone;
  /** Filtre sur la carte visée (composant en jeu, ou carte de la défausse). */
  filtre?: (ctx: Contexte, cible: ComposantEnJeu | InstanceCarte) => boolean;
  /** Cible facultative (la dernière seulement). */
  facultative?: boolean;
}

interface Effet {
  cibles: readonly SpecCible[];
  /** Les cibles forment un ensemble (Couplage fort) : l'ordre ne compte pas. */
  nonOrdonnees?: boolean;
  appliquer: (ctx: Contexte, cibles: readonly Cible[]) => void;
}

// --- Outils des effets --------------------------------------------------------------------------------------

const famille = (cible: InstanceCarte, ...familles: string[]) =>
  familles.includes(carteDe(cible.numero).famille);
const estIa = (cible: InstanceCarte) => famille(cible, 'ia');
const estAgent = (cible: InstanceCarte) => aCapacite(carteDe(cible.numero), 'autonome');
const enJeu = (ctx: Contexte, joueur: IdJoueur, numero: number) =>
  ctx.etat.joueurs[joueur].plateau.some((c) => c.numero === numero);
const protegePar = (ctx: Contexte, joueur: IdJoueur, capacite: 'garde-fous' | 'asynchrone') =>
  ctx.etat.joueurs[joueur].plateau.some((c) => possede(c, capacite));

function composantDe(ctx: Contexte, joueur: IdJoueur, id: Cible): ComposantEnJeu {
  const composant = ctx.etat.joueurs[joueur].plateau.find((c) => c.id === id);
  if (!composant) throw new Error(`Cible absente : ${id}`);
  return composant;
}

function annoncer(ctx: Contexte, joueur: IdJoueur, cible: Cible, statut: Statut): void {
  noter(ctx.etat, { type: 'statut', joueur, cible, statut });
}

/** Le composant visé ne peut pas attaquer jusqu'au prochain tour de son propriétaire inclus. */
function immobiliser(ctx: Contexte, joueur: IdJoueur, id: Cible): void {
  composantDe(ctx, joueur, id).immobiliseJusquAuTour = ctx.etat.tour + 1;
  annoncer(ctx, joueur, id, 'immobilise');
}

function suspendreCapacites(ctx: Contexte, joueur: IdJoueur, id: Cible): void {
  composantDe(ctx, joueur, id).sansCapacitesJusquAuTour = ctx.etat.tour + 1;
  annoncer(ctx, joueur, id, 'sans-capacites');
}

function infliger(ctx: Contexte, joueur: IdJoueur, id: Cible, montant: number): void {
  blesser(ctx.etat, joueur, composantDe(ctx, joueur, id), montant, 'effet');
}

function detruire(ctx: Contexte, joueur: IdJoueur, id: Cible): void {
  composantDe(ctx, joueur, id).pv = 0;
}

const premiere = (cibles: readonly Cible[]): Cible => {
  const cible = cibles[0];
  if (cible === undefined) throw new Error('Cible manquante.');
  return cible;
};

/** Hallucination : une cible tirée au hasard dans les deux camps (SI compris), hors l'attaquant et hors Vétéran. */
function cibleAuHasard(ctx: Contexte, attaquant: ComposantEnJeu): { joueur: IdJoueur; id: Cible } {
  const possibles = ([ctx.joueur, ctx.adverse] as const).flatMap((joueur) => [
    ...ctx.etat.joueurs[joueur].plateau
      .filter((c) => c.id !== attaquant.id && !possede(c, 'veteran'))
      .map((c) => ({ joueur, id: c.id as Cible })),
    { joueur, id: 'si' as Cible },
  ]);
  return possibles[tirerIndex(ctx.etat, possibles.length)] ?? { joueur: ctx.adverse, id: 'si' };
}

// --- Les sorts et les incidents, par numéro de carte ----------------------------------------------------------

const ADVERSE: SpecCible = { zone: 'adverse' };
const ALLIE: SpecCible = { zone: 'allie' };
const RIEN: readonly SpecCible[] = [];

export const EFFETS: ReadonlyMap<number, Effet> = new Map<number, Effet>([
  // Rate limiting : un composant adverse ne peut pas attaquer à son prochain tour.
  [21, { cibles: [ADVERSE], appliquer: (ctx, [c]) => immobiliser(ctx, ctx.adverse, c ?? '') }],
  // Mapping de données : un de vos composants gagne +1 PV.
  [
    30,
    {
      cibles: [ALLIE],
      appliquer: (ctx, cibles) => {
        composantDe(ctx, ctx.joueur, premiere(cibles)).pv += 1;
        annoncer(ctx, ctx.joueur, premiere(cibles), 'bonus-pv');
      },
    },
  ],
  // Chain of thought : piochez 2 cartes.
  [47, { cibles: RIEN, appliquer: (ctx) => piocher(ctx.etat, ctx.joueur, 2) }],
  // Human-in-the-loop : le prochain incident joué contre vous n'a aucun effet.
  [
    48,
    {
      cibles: RIEN,
      appliquer: (ctx) => {
        ctx.etat.joueurs[ctx.joueur].parade = true;
        annoncer(ctx, ctx.joueur, 'si', 'parade');
      },
    },
  ],
  // Prompt système : un de vos agents gagne +2 attaque.
  [
    51,
    {
      cibles: [{ zone: 'allie', filtre: (_ctx, c) => estAgent(c) }],
      appliquer: (ctx, cibles) => {
        composantDe(ctx, ctx.joueur, premiere(cibles)).bonusAttaque += 2;
        annoncer(ctx, ctx.joueur, premiere(cibles), 'bonus-attaque');
      },
    },
  ],
  // Few-shot : un de vos composants IA gagne +1 attaque et +1 PV.
  [
    52,
    {
      cibles: [{ zone: 'allie', filtre: (_ctx, c) => estIa(c) }],
      appliquer: (ctx, cibles) => {
        const composant = composantDe(ctx, ctx.joueur, premiere(cibles));
        composant.bonusAttaque += 1;
        composant.pv += 1;
        annoncer(ctx, ctx.joueur, premiere(cibles), 'bonus-attaque');
      },
    },
  ],
  // Dead Letter Queue : remettez en jeu un composant de votre défausse avec 1 PV.
  [
    53,
    {
      cibles: [
        {
          zone: 'defausse',
          filtre: (ctx, c) =>
            estPriseEnCharge(carteDe(c.numero)) &&
            ['composant', 'evolution'].includes(carteDe(c.numero).type) &&
            ctx.etat.joueurs[ctx.joueur].plateau.length < PLATEAU_MAX,
        },
      ],
      appliquer: (ctx, cibles) => {
        const joueur = ctx.etat.joueurs[ctx.joueur];
        const carte = joueur.defausse.find((c) => c.id === premiere(cibles));
        if (!carte) return;
        joueur.defausse = joueur.defausse.filter((c) => c.id !== carte.id);
        joueur.plateau.push(nouveauComposant(carte, joueur.tours, 1));
        noter(ctx.etat, { type: 'rappel', joueur: ctx.joueur, carte });
      },
    },
  ],
  // Circuit Breaker : votre SI ne perd aucun SLA jusqu'à votre prochain tour.
  [
    54,
    {
      cibles: RIEN,
      appliquer: (ctx) => {
        ctx.etat.joueurs[ctx.joueur].siProtegeJusquAuTour = ctx.etat.tour + 1;
        annoncer(ctx, ctx.joueur, 'si', 'protection-si');
      },
    },
  ],
  // Content-Based Router : 2 dégâts au composant adverse de votre choix.
  [55, { cibles: [ADVERSE], appliquer: (ctx, c) => infliger(ctx, ctx.adverse, premiere(c), 2) }],
  // Splitter : 1 dégât à chaque composant adverse.
  [
    56,
    {
      cibles: RIEN,
      appliquer: (ctx) => {
        for (const c of ctx.etat.joueurs[ctx.adverse].plateau) infliger(ctx, ctx.adverse, c.id, 1);
      },
    },
  ],
  // Idempotent Consumer : annulez Doublon ; sinon piochez une carte.
  [
    57,
    {
      cibles: RIEN,
      appliquer: (ctx) => {
        const touches = ctx.etat.joueurs[ctx.joueur].plateau.filter((c) => c.doublon);
        if (touches.length === 0) {
          piocher(ctx.etat, ctx.joueur, 1);
          return;
        }
        for (const c of touches) {
          c.doublon = false;
          annoncer(ctx, ctx.joueur, c.id, 'doublon-annule');
        }
      },
    },
  ],
  // Retry : un de vos composants qui a attaqué peut attaquer de nouveau, et perd 1 PV.
  [
    58,
    {
      cibles: [{ zone: 'allie', filtre: (_ctx, c) => 'aAttaqueCeTour' in c && c.aAttaqueCeTour }],
      appliquer: (ctx, cibles) => {
        const composant = composantDe(ctx, ctx.joueur, premiere(cibles));
        composant.aAttaqueCeTour = false;
        annoncer(ctx, ctx.joueur, composant.id, 'attaque-a-nouveau');
        blesser(ctx.etat, ctx.joueur, composant, 1, 'effet');
      },
    },
  ],
  // Prompt injection (IA) : un agent adverse attaque aussitôt une cible de votre choix dans son propre camp.
  [
    59,
    {
      cibles: [
        {
          zone: 'adverse',
          filtre: (ctx, c) => estAgent(c) && !protegePar(ctx, ctx.adverse, 'garde-fous'),
        },
        { zone: 'camp-precedent' },
      ],
      appliquer: (ctx, [agent, cible]) =>
        attaqueForcee(
          ctx.etat,
          { joueur: ctx.adverse, composant: composantDe(ctx, ctx.adverse, agent ?? '') },
          { joueur: ctx.adverse, id: cible ?? 'si' },
        ),
    },
  ],
  // Mot de passe en clair : un composant Fichiers adverse est détruit si c'est FTP, sinon il subit 2 dégâts.
  [
    60,
    {
      cibles: [{ zone: 'adverse', filtre: (_ctx, c) => famille(c, 'fichiers') }],
      appliquer: (ctx, cibles) => {
        const cible = premiere(cibles);
        if (composantDe(ctx, ctx.adverse, cible).numero === 1) detruire(ctx, ctx.adverse, cible);
        else infliger(ctx, ctx.adverse, cible, 2);
      },
    },
  ],
  // Certificat expiré : un composant API adverse perd ses capacités et ne peut pas attaquer (sauf OAuth2 en jeu).
  [
    61,
    {
      cibles: [
        { zone: 'adverse', filtre: (ctx, c) => famille(c, 'api') && !enJeu(ctx, ctx.adverse, 20) },
      ],
      appliquer: (ctx, cibles) => {
        suspendreCapacites(ctx, ctx.adverse, premiere(cibles));
        immobiliser(ctx, ctx.adverse, premiere(cibles));
      },
    },
  ],
  // Couplage fort : deux composants adverses liés, quand l'un subit des dégâts, l'autre aussi.
  [
    62,
    {
      cibles: [ADVERSE, ADVERSE],
      nonOrdonnees: true,
      appliquer: (ctx, [a, b]) => {
        composantDe(ctx, ctx.adverse, a ?? '').coupleA = b ?? null;
        composantDe(ctx, ctx.adverse, b ?? '').coupleA = a ?? null;
        annoncer(ctx, ctx.adverse, a ?? '', 'couplage');
        annoncer(ctx, ctx.adverse, b ?? '', 'couplage');
      },
    },
  ],
  // Hallucination (IA) : un composant IA adverse attaque une cible tirée au hasard, dans n'importe quel camp.
  [
    63,
    {
      cibles: [
        {
          zone: 'adverse',
          filtre: (ctx, c) => estIa(c) && !protegePar(ctx, ctx.adverse, 'garde-fous'),
        },
      ],
      appliquer: (ctx, cibles) => {
        const cibleIa = composantDe(ctx, ctx.adverse, premiere(cibles));
        attaqueForcee(
          ctx.etat,
          { joueur: ctx.adverse, composant: cibleIa },
          cibleAuHasard(ctx, cibleIa),
        );
      },
    },
  ],
  // Message poison : détruisez un composant adverse de coût 2 ou moins.
  [
    64,
    {
      cibles: [{ zone: 'adverse', filtre: (_ctx, c) => carteDe(c.numero).cout <= 2 }],
      appliquer: (ctx, cibles) => detruire(ctx, ctx.adverse, premiere(cibles)),
    },
  ],
  // Timeout : un composant adverse ne peut pas attaquer à son prochain tour (Asynchrone protège l'IA).
  [
    65,
    {
      cibles: [
        {
          zone: 'adverse',
          filtre: (ctx, c) => !(estIa(c) && protegePar(ctx, ctx.adverse, 'asynchrone')),
        },
      ],
      appliquer: (ctx, cibles) => immobiliser(ctx, ctx.adverse, premiere(cibles)),
    },
  ],
  // Doublon : le prochain dégât subi par un composant adverse est doublé.
  [
    66,
    {
      cibles: [ADVERSE],
      appliquer: (ctx, cibles) => {
        composantDe(ctx, ctx.adverse, premiere(cibles)).doublon = true;
        annoncer(ctx, ctx.adverse, premiere(cibles), 'doublon');
      },
    },
  ],
  // Fichier vide à 3 h du matin : la prochaine attaque d'un composant Batch adverse n'inflige rien (sauf .ok).
  [
    67,
    {
      cibles: [
        {
          zone: 'adverse',
          filtre: (ctx, c) => aCapacite(carteDe(c.numero), 'batch') && !enJeu(ctx, ctx.adverse, 8),
        },
      ],
      appliquer: (ctx, cibles) => {
        composantDe(ctx, ctx.adverse, premiere(cibles)).attaqueNulle = true;
        annoncer(ctx, ctx.adverse, premiere(cibles), 'attaque-nulle');
      },
    },
  ],
  // Encodage cassé : 2 dégâts à un composant Fichiers ou ESB adverse.
  [
    68,
    {
      cibles: [{ zone: 'adverse', filtre: (_ctx, c) => famille(c, 'fichiers', 'esb') }],
      appliquer: (ctx, cibles) => infliger(ctx, ctx.adverse, premiere(cibles), 2),
    },
  ],
  // Contexte saturé (IA) : un composant IA adverse perd ses capacités jusqu'à la fin de son prochain tour.
  [
    69,
    {
      cibles: [{ zone: 'adverse', filtre: (_ctx, c) => estIa(c) }],
      appliquer: (ctx, cibles) => suspendreCapacites(ctx, ctx.adverse, premiere(cibles)),
    },
  ],
  // Boucle d'agents (IA) : un ou deux agents adverses ne peuvent pas attaquer à leur prochain tour.
  [
    70,
    {
      cibles: [
        {
          zone: 'adverse',
          filtre: (ctx, c) => estAgent(c) && !protegePar(ctx, ctx.adverse, 'asynchrone'),
        },
        {
          zone: 'adverse',
          filtre: (ctx, c) => estAgent(c) && !protegePar(ctx, ctx.adverse, 'asynchrone'),
          facultative: true,
        },
      ],
      nonOrdonnees: true,
      appliquer: (ctx, cibles) => {
        for (const cible of cibles) immobiliser(ctx, ctx.adverse, cible);
      },
    },
  ],
  // Facture de tokens (IA) : l'adversaire a 2 Débit de moins à son prochain tour.
  [
    71,
    {
      cibles: RIEN,
      appliquer: (ctx) => {
        ctx.etat.joueurs[ctx.adverse].malusDebit += 2;
        annoncer(ctx, ctx.adverse, 'si', 'malus-debit');
      },
    },
  ],
]);

// --- Cibles possibles ---------------------------------------------------------------------------------------

function candidats(ctx: Contexte, spec: SpecCible, precedentes: readonly Cible[]): Cible[] {
  const { etat } = ctx;
  const filtre = (c: ComposantEnJeu | InstanceCarte) => spec.filtre?.(ctx, c) ?? true;
  switch (spec.zone) {
    case 'allie':
      return etat.joueurs[ctx.joueur].plateau.filter(filtre).map((c) => c.id);
    case 'adverse':
      return etat.joueurs[ctx.adverse].plateau.filter(filtre).map((c) => c.id);
    case 'defausse':
      return etat.joueurs[ctx.joueur].defausse.filter(filtre).map((c) => c.id);
    case 'camp-precedent': {
      // Prompt injection : dans le camp de l'agent visé, hors l'agent lui-même et hors Vétéran, ou son SI.
      const camp = etat.joueurs[ctx.adverse].plateau;
      const autres = camp.filter((c) => c.id !== precedentes[0] && !possede(c, 'veteran'));
      return [...autres.filter(filtre).map((c) => c.id), 'si'];
    }
  }
}

function combiner(
  ctx: Contexte,
  specs: readonly SpecCible[],
  precedentes: readonly Cible[],
): Cible[][] {
  const [spec, ...suite] = specs;
  if (!spec) return [[...precedentes]];
  const choix = candidats(ctx, spec, precedentes).filter((c) => !precedentes.includes(c));
  const combinaisons = choix.flatMap((cible) => combiner(ctx, suite, [...precedentes, cible]));
  return spec.facultative ? [[...precedentes], ...combinaisons] : combinaisons;
}

/** Toutes les combinaisons de cibles légales d'un sort ou d'un incident pour le joueur ; vide s'il ne se joue pas. */
export function combinaisonsCibles(etat: EtatPartie, joueur: IdJoueur, numero: number): Cible[][] {
  const effet = EFFETS.get(numero);
  if (!effet) return [];
  const ctx = { etat, joueur, adverse: adversaire(joueur) };
  const toutes = combiner(ctx, effet.cibles, []);
  if (!effet.nonOrdonnees) return toutes;
  const vues = new Set<string>();
  return toutes.filter((cibles) => {
    const cle = [...cibles].sort().join('|');
    if (vues.has(cle)) return false;
    vues.add(cle);
    return true;
  });
}

// --- Jouer un sort ou un incident ---------------------------------------------------------------------------

const memesCibles = (a: readonly Cible[], b: readonly Cible[]) =>
  a.length === b.length && a.every((c, i) => c === b[i]);

/** Joue un sort ou un incident de la main du joueur, avec ses cibles ; renvoie une erreur si c'est illégal. */
export function jouer(
  etat: EtatPartie,
  joueur: IdJoueur,
  carteId: string,
  cibles: readonly Cible[],
): ErreurAction | null {
  const etatJoueur = etat.joueurs[joueur];
  const instance = etatJoueur.main.find((c) => c.id === carteId);
  if (!instance) return erreur('carte-absente', 'Cette carte n’est pas dans votre main.');
  const carte = carteDe(instance.numero);
  if (carte.type !== 'sort' && carte.type !== 'incident') {
    return erreur('mauvais-type', 'Seuls les sorts et les incidents se jouent ainsi.');
  }
  const effet = EFFETS.get(carte.numero);
  if (!effet)
    return erreur('carte-non-prise-en-charge', 'Cette carte ne peut pas encore être jouée.');
  const cout = coutEffectif(etat, joueur, carte.numero);
  if (cout > etatJoueur.debit) {
    return erreur('debit-insuffisant', 'Pas assez de Débit pour jouer cette carte.');
  }
  if (!combinaisonsCibles(etat, joueur, carte.numero).some((c) => memesCibles(c, cibles))) {
    return erreur('cible-invalide', 'Ces cibles ne conviennent pas à cette carte.');
  }

  consommerCache(etat, joueur, carte.numero);
  etatJoueur.debit -= cout;
  etatJoueur.main = etatJoueur.main.filter((c) => c.id !== carteId);
  etatJoueur.defausse.push(instance);
  noter(etat, { type: 'jeu', joueur, carte: instance, cibles: [...cibles] });

  const adverse = adversaire(joueur);
  if (carte.type === 'incident' && etat.joueurs[adverse].parade) {
    etat.joueurs[adverse].parade = false;
    noter(etat, { type: 'parade', joueur: adverse, carte: instance });
    return null;
  }
  effet.appliquer({ etat, joueur, adverse }, cibles);
  resoudreDestructions(etat);
  return null;
}
