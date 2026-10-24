import type { Carte } from '../carte.ts';
import { choisirJeu } from './bot-sorts.ts';
import { DEBIT_DECOMMISSION, carteDe } from './outils.ts';
import { estPriseEnCharge } from './prise-en-charge.ts';
import type { Action } from './types.ts';
import type { VueJoueur } from './vue.ts';

/**
 * Bot « Batch de nuit » (US-011) : simple et prévisible. Il ne voit que sa vue de la partie (aucune triche) et
 * choisit une action à la fois parmi `vue.actions` :
 * 1. poser la carte la plus chère qu'il peut payer (une évolution d'abord) ;
 * 2. jouer un sort ou un incident utile (détruire, immobiliser, protéger, piocher : voir bot-sorts.ts) ;
 * 3. attaquer : ce qu'il peut détruire en survivant, sinon le SI, sinon un échange rentable ;
 * 4. décommissionner une carte inutile ou qui permet d'en jouer une autre ;
 * 5. finir son tour.
 */
export function choisirActionBatchDeNuit(vue: VueJoueur): Action {
  return (
    choisirPose(vue) ??
    choisirIa(vue) ??
    choisirJeu(vue) ??
    choisirAttaque(vue) ??
    choisirDecommission(vue) ??
    FIN_DE_TOUR
  );
}

const FIN_DE_TOUR: Action = { type: 'finirTour' };

/** La carte du catalogue d'une carte de la main du bot (les actions ne citent que des cartes de sa main). */
export function carteEnMain(vue: VueJoueur, id: string): Carte {
  const instance = vue.moi.main.find((c) => c.id === id);
  if (!instance) throw new Error(`Carte absente de la main : ${id}`);
  return carteDe(instance.numero);
}

const statistiques = (carte: Carte): number => ('attaque' in carte ? carte.attaque + carte.pv : 0);

export function choisirPose(vue: VueJoueur): Action | null {
  const poses = vue.actions
    .filter((a) => a.type === 'poser' || a.type === 'evoluer')
    .map((action) => ({ action, carte: carteEnMain(vue, action.carte) }));
  poses.sort(
    (a, b) =>
      Number(b.action.type === 'evoluer') - Number(a.action.type === 'evoluer') ||
      b.carte.cout - a.carte.cout ||
      statistiques(b.carte) - statistiques(a.carte),
  );
  return poses[0]?.action ?? null;
}

/**
 * Migration (la carte la plus chère vers laquelle migrer) et Outillage (le composant aux capacités les plus
 * nombreuses) ; le bot ne se sert pas du Routage multi-modèles.
 */
export function choisirIa(vue: VueJoueur): Action | null {
  const migrations = vue.actions
    .filter((a) => a.type === 'migrer')
    .sort((a, b) => carteEnMain(vue, b.carte).cout - carteEnMain(vue, a.carte).cout);
  if (migrations[0]) return migrations[0];
  const capacites = (id: string) => {
    const source = vue.moi.plateau.find((c) => c.id === id);
    return source ? carteDe(source.numero).capacites.length : 0;
  };
  const outillages = vue.actions
    .filter((a) => a.type === 'outiller')
    .filter((a) => capacites(a.source) > 0)
    .sort((a, b) => capacites(b.source) - capacites(a.source));
  return outillages[0] ?? null;
}

export function scoreAttaque(
  vue: VueJoueur,
  action: Extract<Action, { type: 'attaquer' }>,
): number {
  const attaquant = vue.moi.plateau.find((c) => c.id === action.attaquant);
  if (!attaquant) return 0;
  const force = attaquant.attaque;
  if (action.cible === 'si') return force >= vue.adversaire.sla ? 1_000 : 50 + force;

  const cible = vue.adversaire.plateau.find((c) => c.id === action.cible);
  if (!cible) return 0;
  const detruit = force >= cible.pv;
  const survit = cible.attaque < attaquant.pv;
  const valeurCible = carteDe(cible.numero).cout;
  if (detruit && survit) return 100 + valeurCible * 5;
  if (detruit) return valeurCible >= carteDe(attaquant.numero).cout ? 60 + valeurCible : 10;
  return survit ? 20 : 0;
}

export function choisirAttaque(vue: VueJoueur): Action | null {
  let meilleure: Action | null = null;
  let meilleurScore = 0;
  for (const action of vue.actions) {
    if (action.type !== 'attaquer') continue;
    const score = scoreAttaque(vue, action);
    if (score > meilleurScore) {
      meilleure = action;
      meilleurScore = score;
    }
  }
  return meilleure;
}

/**
 * Décommissionne une carte qu'il ne sait pas jouer, ou la moins chère si le Débit gagné permet d'en poser une autre.
 * Appelé seulement quand aucune pose n'est possible.
 */
export function choisirDecommission(vue: VueJoueur): Action | null {
  const candidates = vue.actions.filter((a) => a.type === 'decommissionner');
  const injouable = candidates.find((a) => !estPriseEnCharge(carteEnMain(vue, a.carte)));
  if (injouable) return injouable;

  const parCout = [...candidates].sort(
    (a, b) => carteEnMain(vue, a.carte).cout - carteEnMain(vue, b.carte).cout,
  );
  return parCout.find((candidate) => composantRenduPosable(vue, candidate.carte)) ?? null;
}

/**
 * Le composant de la main que le Débit gagné en décommissionnant la carte `sacrifiee` permettrait de poser ;
 * `undefined` s'il n'y en a pas, ou si le plateau est plein.
 */
export function composantRenduPosable(vue: VueJoueur, sacrifiee: string): Carte | undefined {
  if (vue.moi.plateau.length >= 5) return undefined;
  const debit = vue.moi.debit + DEBIT_DECOMMISSION[carteEnMain(vue, sacrifiee).rarete];
  return vue.moi.main
    .filter((c) => c.id !== sacrifiee)
    .map((c) => carteDe(c.numero))
    .find((carte) => carte.type === 'composant' && estPriseEnCharge(carte) && carte.cout <= debit);
}
