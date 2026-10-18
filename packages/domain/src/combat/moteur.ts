import { attaquer } from './combat.ts';
import { ciblesDeRenfort, effetsALaPose } from './effets-composants.ts';
import { jouer } from './effets.ts';
import { executerIa, lancerAgentsAutonomes } from './ia.ts';
import {
  carteDe,
  DEBIT_DECOMMISSION,
  erreur,
  noter,
  nouveauComposant,
  PLATEAU_MAX,
} from './outils.ts';
import { estPriseEnCharge, valeurConnecteur } from './prise-en-charge.ts';
import { finirTour, piocher } from './tour.ts';
import type {
  Action,
  ComposantEnJeu,
  ErreurAction,
  EtatPartie,
  IdJoueur,
  InstanceCarte,
  ResultatAction,
} from './types.ts';

function prendreEnMain(
  etat: EtatPartie,
  joueur: IdJoueur,
  carteId: string,
): InstanceCarte | ErreurAction {
  const carte = etat.joueurs[joueur].main.find((c) => c.id === carteId);
  return carte ?? erreur('carte-absente', 'Cette carte n’est pas dans votre main.');
}

function retirerDeLaMain(etat: EtatPartie, joueur: IdJoueur, carteId: string): void {
  const etatJoueur = etat.joueurs[joueur];
  etatJoueur.main = etatJoueur.main.filter((c) => c.id !== carteId);
}

/** Vérifications communes à la pose d'un composant ou d'une évolution. */
function verifierPose(
  etat: EtatPartie,
  joueur: IdJoueur,
  instance: InstanceCarte,
  type: 'composant' | 'evolution',
): ErreurAction | null {
  const carte = carteDe(instance.numero);
  if (carte.type !== type) {
    const attendu = type === 'composant' ? 'un composant' : 'une évolution';
    return erreur('mauvais-type', `Cette carte n’est pas ${attendu}.`);
  }
  if (!estPriseEnCharge(carte)) {
    return erreur('carte-non-prise-en-charge', 'Cette carte ne peut pas encore être jouée.');
  }
  if (carte.cout > etat.joueurs[joueur].debit) {
    return erreur('debit-insuffisant', 'Pas assez de Débit pour jouer cette carte.');
  }
  return null;
}

function poser(
  etat: EtatPartie,
  joueur: IdJoueur,
  carteId: string,
  cible: string | undefined,
): ErreurAction | null {
  const instance = prendreEnMain(etat, joueur, carteId);
  if ('code' in instance) return instance;
  const refus = verifierPose(etat, joueur, instance, 'composant');
  if (refus) return refus;
  const etatJoueur = etat.joueurs[joueur];
  if (etatJoueur.plateau.length >= PLATEAU_MAX) {
    return erreur('plateau-plein', 'Votre plateau est plein (5 composants).');
  }
  const carte = carteDe(instance.numero);
  const renforts = ciblesDeRenfort(etat, joueur, carte.numero);
  const cibleAttendue = renforts.length > 0;
  if (
    cibleAttendue !== (cible !== undefined) ||
    (cible !== undefined && !renforts.includes(cible))
  ) {
    return erreur('cible-invalide', 'Cette cible ne convient pas à cette carte.');
  }
  etatJoueur.debit -= carte.cout;
  retirerDeLaMain(etat, joueur, carteId);
  const pose = nouveauComposant(instance, etatJoueur.tours);
  etatJoueur.plateau.push(pose);
  noter(etat, { type: 'pose', joueur, carte: instance });
  piocher(etat, joueur, valeurConnecteur(carte));
  effetsALaPose(etat, joueur, pose, cible);
  return null;
}

/** Une évolution remplace sa carte d'origine, PV pleins, et peut attaquer si l'origine le pouvait. */
function evoluer(
  etat: EtatPartie,
  joueur: IdJoueur,
  carteId: string,
  origineId: string,
): ErreurAction | null {
  const instance = prendreEnMain(etat, joueur, carteId);
  if ('code' in instance) return instance;
  const refus = verifierPose(etat, joueur, instance, 'evolution');
  if (refus) return refus;
  const carte = carteDe(instance.numero);
  if (carte.type !== 'evolution')
    return erreur('mauvais-type', 'Cette carte n’est pas une évolution.');
  const etatJoueur = etat.joueurs[joueur];
  const index = etatJoueur.plateau.findIndex((c) => c.id === origineId);
  const origine = etatJoueur.plateau[index];
  if (origine?.numero !== carte.origine) {
    const nomOrigine = carteDe(carte.origine).nom;
    return erreur('origine-invalide', `Cette évolution se pose sur ${nomOrigine}.`);
  }
  etatJoueur.debit -= carte.cout;
  retirerDeLaMain(etat, joueur, carteId);
  const evolution: ComposantEnJeu = { ...origine, ...instance, pv: carte.pv };
  etatJoueur.plateau[index] = evolution;
  const carteOrigine = { id: origine.id, numero: origine.numero };
  etatJoueur.defausse.push(carteOrigine);
  noter(etat, { type: 'evolution', joueur, carte: instance, origine: carteOrigine });
  piocher(etat, joueur, valeurConnecteur(carte));
  return null;
}

function decommissionner(etat: EtatPartie, joueur: IdJoueur, carteId: string): ErreurAction | null {
  const etatJoueur = etat.joueurs[joueur];
  if (etatJoueur.aDecommissionne) {
    return erreur('deja-decommissionne', 'Vous avez déjà décommissionné une carte ce tour.');
  }
  const instance = prendreEnMain(etat, joueur, carteId);
  if ('code' in instance) return instance;
  const debit = DEBIT_DECOMMISSION[carteDe(instance.numero).rarete];
  retirerDeLaMain(etat, joueur, carteId);
  etatJoueur.defausse.push(instance);
  etatJoueur.debit += debit;
  etatJoueur.aDecommissionne = true;
  noter(etat, { type: 'decommission', joueur, carte: instance, debit });
  return null;
}

function executer(etat: EtatPartie, action: Action): ErreurAction | null {
  const ia = executerIa(etat, action);
  if (ia !== undefined) return ia;
  const joueur = etat.actif;
  switch (action.type) {
    case 'poser':
      return poser(etat, joueur, action.carte, action.cible);
    case 'evoluer':
      return evoluer(etat, joueur, action.carte, action.origine);
    case 'decommissionner':
      return decommissionner(etat, joueur, action.carte);
    case 'attaquer':
      return attaquer(etat, joueur, action.attaquant, action.cible);
    case 'jouer':
      return jouer(etat, joueur, action.carte, action.cibles);
    case 'finirTour':
      finirTour(etat);
      // Les agents Autonomes du joueur qui commence son tour attaquent seuls (US-020).
      if (!etat.issue) lancerAgentsAutonomes(etat, etat.actif);
      return null;
    default:
      return null;
  }
}

/**
 * Applique une action du joueur actif. Fonction pure : l'état reçu n'est jamais modifié (ADR 0013).
 */
export function appliquer(etat: EtatPartie, action: Action): ResultatAction {
  if (etat.issue) {
    return { ok: false, erreur: erreur('partie-terminee', 'La partie est terminée.') };
  }
  const suivant = structuredClone(etat);
  const refus = executer(suivant, action);
  return refus ? { ok: false, erreur: refus } : { ok: true, etat: suivant };
}
