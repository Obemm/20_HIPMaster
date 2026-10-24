import type { Carte } from '../carte.ts';
import { LANGUE_REFERENCE, type Langue } from '../langues/textes.ts';
import { texteCarte } from '../langues/traduire.ts';
import { choisirJeu } from './bot-sorts.ts';
import {
  carteEnMain,
  choisirAttaque,
  choisirDecommission,
  choisirIa,
  choisirPose,
  composantRenduPosable,
} from './bot.ts';
import { DEBIT_DECOMMISSION, carteDe, possede } from './outils.ts';
import { estPriseEnCharge } from './prise-en-charge.ts';
import type { Action, Cible } from './types.ts';
import type { ComposantVisible, VueJoueur } from './vue.ts';

/** Le meilleur coup du moment, et pourquoi, en une phrase de joueur (US-066), dans sa langue (US-081). */
export interface Conseil {
  action: Action;
  explication: string;
}

type Attaque = Extract<Action, { type: 'attaquer' }>;

/** Ce qu'il faut pour écrire une explication : la vue du joueur et sa langue. */
interface Contexte {
  vue: VueJoueur;
  langue: Langue;
}

/** La phrase dans la langue du joueur ; le français, langue de référence, à défaut. */
const dire = (ctx: Contexte, fr: string, en: string): string => (ctx.langue === 'en' ? en : fr);

/**
 * Conseille le joueur dont c'est le tour, à partir de sa seule vue (ADR 0004, 0013) : il suit les règles de Batch
 * de nuit (bot.ts), dont chaque choix s'explique, plutôt que la recherche des bots plus forts, qui ne se raconte
 * pas. `null` quand il n'a rien à jouer (tour adverse, partie finie).
 */
export function conseiller(vue: VueJoueur, langue: Langue = LANGUE_REFERENCE): Conseil | null {
  if (vue.actions.length === 0) return null;
  const ctx: Contexte = { vue, langue };
  const pose = choisirPose(vue);
  if (pose) return { action: pose, explication: expliquerPose(ctx, pose) };
  const ia = choisirIa(vue);
  if (ia) return { action: ia, explication: expliquerIa(ctx, ia) };
  const jeu = choisirJeu(vue);
  if (jeu?.type === 'jouer') return { action: jeu, explication: expliquerJeu(ctx, jeu) };
  const attaque = choisirAttaque(vue);
  if (attaque?.type === 'attaquer') {
    return { action: attaque, explication: expliquerAttaque(ctx, attaque) };
  }
  const decommission = choisirDecommission(vue);
  if (decommission?.type === 'decommissionner') {
    return {
      action: decommission,
      explication: expliquerDecommission(ctx, decommission.carte),
    };
  }
  return { action: { type: 'finirTour' }, explication: expliquerFin(ctx) };
}

/** Le nom d'une carte du catalogue dans la langue du joueur. */
const nomNumero = (ctx: Contexte, numero: number) => texteCarte(carteDe(numero), ctx.langue).nom;

/** Le nom d'une carte en jeu, en main ou dans sa défausse ; « le SI adverse » pour `si`. */
function nom(ctx: Contexte, id: Cible): string {
  if (id === 'si') return dire(ctx, 'le SI adverse', 'the opposing System');
  const { vue } = ctx;
  const instance = [
    ...vue.moi.main,
    ...vue.moi.plateau,
    ...vue.adversaire.plateau,
    ...vue.moi.defausse,
    ...vue.adversaire.defausse,
  ].find((c) => c.id === id);
  return instance ? nomNumero(ctx, instance.numero) : dire(ctx, 'cette carte', 'this card');
}

/** Un effet du catalogue (« Un composant adverse… ») repris dans une phrase (« : un composant adverse… »). */
const enMinuscule = (texte: string) => texte.charAt(0).toLowerCase() + texte.slice(1);

function expliquerPose(ctx: Contexte, pose: Action): string {
  const { vue } = ctx;
  if (pose.type === 'evoluer') {
    const origine = nom(ctx, pose.origine);
    const evolution = nom(ctx, pose.carte);
    return dire(
      ctx,
      `Faites évoluer ${origine} en ${evolution} : l’évolution prend sa place, plus forte, sans occuper de case de plus.`,
      `Evolve ${origine} into ${evolution}: the evolution takes its place, stronger, without taking an extra slot.`,
    );
  }
  if (pose.type !== 'poser') return '';
  const carte = nomNumero(ctx, carteEnMain(vue, pose.carte).numero);
  const cible = pose.cible ? nom(ctx, pose.cible) : undefined;
  const renfort = cible ? dire(ctx, ` en renforçant ${cible}`, ` to reinforce ${cible}`) : '';
  const autres = new Set(
    vue.actions
      .filter((a) => a.type === 'poser' || a.type === 'evoluer')
      .map((a) => carteEnMain(vue, a.carte).numero),
  );
  return autres.size > 1
    ? dire(
        ctx,
        `Posez ${carte}${renfort} : c’est la carte la plus forte que votre Débit permet.`,
        `Deploy ${carte}${renfort}: it’s the strongest card your Throughput allows.`,
      )
    : dire(
        ctx,
        `Posez ${carte}${renfort} : votre Débit le permet, et chaque composant en jeu pourra attaquer dès votre prochain tour.`,
        `Deploy ${carte}${renfort}: your Throughput allows it, and every component in play can attack from your next turn.`,
      );
}

function expliquerIa(ctx: Contexte, action: Action): string {
  if (action.type === 'migrer') {
    const source = nom(ctx, action.source);
    const carte = nom(ctx, action.carte);
    return dire(
      ctx,
      `Migrez ${source} vers ${carte} : la Migration remplace l’ancien composant par un plus moderne, pour moins de Débit.`,
      `Migrate ${source} to ${carte}: Migration replaces the old component with a more modern one, for less Throughput.`,
    );
  }
  if (action.type === 'outiller') {
    const source = nom(ctx, action.source);
    return dire(
      ctx,
      `Utilisez l’Outillage sur ${source} : vos agents empruntent ses capacités jusqu’à la fin du tour.`,
      `Use Tooling on ${source}: your agents borrow its abilities until the end of the turn.`,
    );
  }
  return '';
}

function expliquerJeu(ctx: Contexte, jeu: Extract<Action, { type: 'jouer' }>): string {
  const carte = texteCarte(carteEnMain(ctx.vue, jeu.carte), ctx.langue);
  const noms = jeu.cibles.map((c) => nom(ctx, c)).join(dire(ctx, ' et ', ' and '));
  const cibles = jeu.cibles.length ? dire(ctx, ` sur ${noms}`, ` on ${noms}`) : '';
  const effet = carte.effet
    ? enMinuscule(carte.effet)
    : dire(ctx, 'c’est le bon moment pour cette carte.', 'it’s the right moment for this card.');
  return dire(
    ctx,
    `Jouez ${carte.nom}${cibles} : ${effet}`,
    `Play ${carte.nom}${cibles}: ${effet}`,
  );
}

function expliquerAttaque(ctx: Contexte, attaque: Attaque): string {
  const { vue } = ctx;
  const attaquant = vue.moi.plateau.find((c) => c.id === attaque.attaquant);
  if (!attaquant) return '';
  const nomAttaquant = nomNumero(ctx, attaquant.numero);
  const points = attaquant.attaque;
  if (attaque.cible === 'si') {
    return points >= vue.adversaire.sla
      ? dire(
          ctx,
          `Attaquez le SI adverse avec ${nomAttaquant} : ses ${points} points d’attaque font tomber son SLA à 0, vous gagnez.`,
          `Attack the opposing System with ${nomAttaquant}: its ${points} attack points bring its SLA down to 0, and you win.`,
        )
      : dire(
          ctx,
          `Attaquez le SI adverse avec ${nomAttaquant} : rien ne le protège, et il perd ${points} points de SLA.`,
          `Attack the opposing System with ${nomAttaquant}: nothing protects it, and it loses ${points} SLA points.`,
        );
  }
  const cible = vue.adversaire.plateau.find((c) => c.id === attaque.cible);
  if (!cible) return '';
  const nomCible = nomNumero(ctx, cible.numero);
  const raison = raisonAttaque(ctx, attaquant, cible);
  return dire(
    ctx,
    `Attaquez ${nomCible} avec ${nomAttaquant} : ${raison}`,
    `Attack ${nomCible} with ${nomAttaquant}: ${raison}`,
  );
}

/** Pourquoi attaquer ce composant, dans l'ordre des règles de Batch de nuit (`scoreAttaque`). */
function raisonAttaque(
  ctx: Contexte,
  attaquant: ComposantVisible,
  cible: ComposantVisible,
): string {
  const detruit = attaquant.attaque >= cible.pv;
  const survit = cible.attaque < attaquant.pv;
  const garde = possede(cible, 'garde')
    ? dire(ctx, 'il a Garde et protège le SI ; ', 'it has Guard and protects the System; ')
    : '';
  const nomAttaquant = nomNumero(ctx, attaquant.numero);
  if (detruit && survit) {
    return dire(
      ctx,
      `${garde}votre ${nomAttaquant} le détruit et survit à sa riposte.`,
      `${garde}your ${nomAttaquant} destroys it and survives the counter-attack.`,
    );
  }
  if (detruit && carteDe(cible.numero).cout >= carteDe(attaquant.numero).cout) {
    return dire(
      ctx,
      `${garde}les deux tombent, mais il vaut plus de Débit que votre ${nomAttaquant} : l’échange vous est favorable.`,
      `${garde}both fall, but it is worth more Throughput than your ${nomAttaquant}: the trade is in your favour.`,
    );
  }
  if (detruit) {
    return dire(
      ctx,
      `${garde}vous le détruisez, même si la riposte détruit aussi ${nomAttaquant}.`,
      `${garde}you destroy it, even though the counter-attack also destroys ${nomAttaquant}.`,
    );
  }
  return dire(
    ctx,
    `${garde}vous l’affaiblissez, et ${nomAttaquant} survit à la riposte.`,
    `${garde}you weaken it, and ${nomAttaquant} survives the counter-attack.`,
  );
}

function expliquerDecommission(ctx: Contexte, id: string): string {
  const carte: Carte = carteEnMain(ctx.vue, id);
  const nomCarte = nomNumero(ctx, carte.numero);
  const gain = DEBIT_DECOMMISSION[carte.rarete];
  if (!estPriseEnCharge(carte)) {
    return dire(
      ctx,
      `Décommissionnez ${nomCarte} : cette carte ne se joue pas encore, autant en tirer ${gain} Débit.`,
      `Decommission ${nomCarte}: this card can’t be played yet, so you might as well get ${gain} Throughput from it.`,
    );
  }
  const posable = composantRenduPosable(ctx.vue, id);
  const autre = posable
    ? nomNumero(ctx, posable.numero)
    : dire(ctx, 'une autre carte', 'another card');
  const gagne =
    gain === 1 ? 'le Débit gagné vous permet' : `les ${gain} Débit gagnés vous permettent`;
  return dire(
    ctx,
    `Décommissionnez ${nomCarte} : ${gagne} de poser ${autre}.`,
    `Decommission ${nomCarte}: the ${gain} Throughput gained lets you deploy ${autre}.`,
  );
}

function expliquerFin(ctx: Contexte): string {
  const { actions } = ctx.vue;
  if (actions.some((a) => a.type === 'attaquer')) {
    return dire(
      ctx,
      'Finissez votre tour : vos attaques possibles vous feraient perdre plus qu’elles ne rapportent.',
      'End your turn: your possible attacks would cost you more than they would gain.',
    );
  }
  if (actions.some((a) => a.type === 'jouer')) {
    return dire(
      ctx,
      'Finissez votre tour : gardez vos cartes en main pour un meilleur moment.',
      'End your turn: keep your cards in hand for a better moment.',
    );
  }
  return dire(
    ctx,
    'Finissez votre tour : il ne vous reste rien d’utile à faire.',
    'End your turn: there’s nothing useful left to do.',
  );
}
