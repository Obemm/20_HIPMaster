import type { Carte } from '../carte.ts';
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

/** Le meilleur coup du moment, et pourquoi, en une phrase de joueur (US-066). */
export interface Conseil {
  action: Action;
  explication: string;
}

type Attaque = Extract<Action, { type: 'attaquer' }>;

/**
 * Conseille le joueur dont c'est le tour, à partir de sa seule vue (ADR 0004, 0013) : il suit les règles de Batch
 * de nuit (bot.ts), dont chaque choix s'explique, plutôt que la recherche des bots plus forts, qui ne se raconte
 * pas. `null` quand il n'a rien à jouer (tour adverse, partie finie).
 */
export function conseiller(vue: VueJoueur): Conseil | null {
  if (vue.actions.length === 0) return null;
  const pose = choisirPose(vue);
  if (pose) return { action: pose, explication: expliquerPose(vue, pose) };
  const ia = choisirIa(vue);
  if (ia) return { action: ia, explication: expliquerIa(vue, ia) };
  const jeu = choisirJeu(vue);
  if (jeu?.type === 'jouer') return { action: jeu, explication: expliquerJeu(vue, jeu) };
  const attaque = choisirAttaque(vue);
  if (attaque?.type === 'attaquer') {
    return { action: attaque, explication: expliquerAttaque(vue, attaque) };
  }
  const decommission = choisirDecommission(vue);
  if (decommission?.type === 'decommissionner') {
    return {
      action: decommission,
      explication: expliquerDecommission(vue, decommission.carte),
    };
  }
  return { action: { type: 'finirTour' }, explication: expliquerFin(vue) };
}

/** Le nom d'une carte en jeu, en main ou dans sa défausse ; « le SI adverse » pour `si`. */
function nom(vue: VueJoueur, id: Cible): string {
  if (id === 'si') return 'le SI adverse';
  const instance = [
    ...vue.moi.main,
    ...vue.moi.plateau,
    ...vue.adversaire.plateau,
    ...vue.moi.defausse,
    ...vue.adversaire.defausse,
  ].find((c) => c.id === id);
  return instance ? carteDe(instance.numero).nom : 'cette carte';
}

/** Un effet du catalogue (« Un composant adverse… ») repris dans une phrase (« : un composant adverse… »). */
const enMinuscule = (texte: string) => texte.charAt(0).toLowerCase() + texte.slice(1);

function expliquerPose(vue: VueJoueur, pose: Action): string {
  if (pose.type === 'evoluer') {
    return `Faites évoluer ${nom(vue, pose.origine)} en ${nom(vue, pose.carte)} : l’évolution prend sa place, plus forte, sans occuper de case de plus.`;
  }
  if (pose.type !== 'poser') return '';
  const carte = carteEnMain(vue, pose.carte);
  const renfort = pose.cible ? ` en renforçant ${nom(vue, pose.cible)}` : '';
  const autres = new Set(
    vue.actions
      .filter((a) => a.type === 'poser' || a.type === 'evoluer')
      .map((a) => carteEnMain(vue, a.carte).numero),
  );
  return autres.size > 1
    ? `Posez ${carte.nom}${renfort} : c’est la carte la plus forte que votre Débit permet.`
    : `Posez ${carte.nom}${renfort} : votre Débit le permet, et chaque composant en jeu pourra attaquer dès votre prochain tour.`;
}

function expliquerIa(vue: VueJoueur, action: Action): string {
  if (action.type === 'migrer') {
    return `Migrez ${nom(vue, action.source)} vers ${nom(vue, action.carte)} : la Migration remplace l’ancien composant par un plus moderne, pour moins de Débit.`;
  }
  if (action.type === 'outiller') {
    return `Utilisez l’Outillage sur ${nom(vue, action.source)} : vos agents empruntent ses capacités jusqu’à la fin du tour.`;
  }
  return '';
}

function expliquerJeu(vue: VueJoueur, jeu: Extract<Action, { type: 'jouer' }>): string {
  const carte = carteEnMain(vue, jeu.carte);
  const cibles = jeu.cibles.length ? ` sur ${jeu.cibles.map((c) => nom(vue, c)).join(' et ')}` : '';
  const effet = carte.effet ? enMinuscule(carte.effet) : 'c’est le bon moment pour cette carte.';
  return `Jouez ${carte.nom}${cibles} : ${effet}`;
}

function expliquerAttaque(vue: VueJoueur, attaque: Attaque): string {
  const attaquant = vue.moi.plateau.find((c) => c.id === attaque.attaquant);
  if (!attaquant) return '';
  const nomAttaquant = carteDe(attaquant.numero).nom;
  if (attaque.cible === 'si') {
    return attaquant.attaque >= vue.adversaire.sla
      ? `Attaquez le SI adverse avec ${nomAttaquant} : ses ${attaquant.attaque} points d’attaque font tomber son SLA à 0, vous gagnez.`
      : `Attaquez le SI adverse avec ${nomAttaquant} : rien ne le protège, et il perd ${attaquant.attaque} points de SLA.`;
  }
  const cible = vue.adversaire.plateau.find((c) => c.id === attaque.cible);
  if (!cible) return '';
  return `Attaquez ${carteDe(cible.numero).nom} avec ${nomAttaquant} : ${raisonAttaque(attaquant, cible)}`;
}

/** Pourquoi attaquer ce composant, dans l'ordre des règles de Batch de nuit (`scoreAttaque`). */
function raisonAttaque(attaquant: ComposantVisible, cible: ComposantVisible): string {
  const detruit = attaquant.attaque >= cible.pv;
  const survit = cible.attaque < attaquant.pv;
  const garde = possede(cible, 'garde') ? 'il a Garde et protège le SI ; ' : '';
  const nomAttaquant = carteDe(attaquant.numero).nom;
  if (detruit && survit) {
    return `${garde}votre ${nomAttaquant} le détruit et survit à sa riposte.`;
  }
  if (detruit && carteDe(cible.numero).cout >= carteDe(attaquant.numero).cout) {
    return `${garde}les deux tombent, mais il vaut plus de Débit que votre ${nomAttaquant} : l’échange vous est favorable.`;
  }
  if (detruit)
    return `${garde}vous le détruisez, même si la riposte détruit aussi ${nomAttaquant}.`;
  return `${garde}vous l’affaiblissez, et ${nomAttaquant} survit à la riposte.`;
}

function expliquerDecommission(vue: VueJoueur, id: string): string {
  const carte: Carte = carteEnMain(vue, id);
  const gain = DEBIT_DECOMMISSION[carte.rarete];
  if (!estPriseEnCharge(carte)) {
    return `Décommissionnez ${carte.nom} : cette carte ne se joue pas encore, autant en tirer ${gain} Débit.`;
  }
  const posable = composantRenduPosable(vue, id);
  const gagne =
    gain === 1 ? 'le Débit gagné vous permet' : `les ${gain} Débit gagnés vous permettent`;
  return `Décommissionnez ${carte.nom} : ${gagne} de poser ${posable?.nom ?? 'une autre carte'}.`;
}

function expliquerFin(vue: VueJoueur): string {
  if (vue.actions.some((a) => a.type === 'attaquer')) {
    return 'Finissez votre tour : vos attaques possibles vous feraient perdre plus qu’elles ne rapportent.';
  }
  if (vue.actions.some((a) => a.type === 'jouer')) {
    return 'Finissez votre tour : gardez vos cartes en main pour un meilleur moment.';
  }
  return 'Finissez votre tour : il ne vous reste rien d’utile à faire.';
}
