import type { Famille } from '../carte.ts';
import { actif, carteDe, noter } from './outils.ts';
import { aCapacite } from './prise-en-charge.ts';
import { piocher } from './tour.ts';
import type { ComposantEnJeu, EtatPartie, IdJoueur } from './types.ts';

/** Effets propres des composants (US-019), déclenchés à la pose ou valables tant que la carte est en jeu. */

const CDC = 34;
const BASE_VECTORIELLE = 49;

/** Pose : piochez la première carte de ces familles dans votre pioche (Designer, API Hub, Event Portal). */
const PIOCHE_CIBLEE: ReadonlyMap<number, readonly Famille[]> = new Map<number, readonly Famille[]>([
  [14, ['patterns']],
  [19, ['api', 'ia']],
  [32, ['eda']],
]);

/** Pose : un de vos composants de cette famille gagne +1 attaque (OpenAPI, AsyncAPI). */
const RENFORT: ReadonlyMap<number, Famille> = new Map<number, Famille>([
  [23, 'api'],
  [38, 'eda'],
]);

const estAgent = (composant: ComposantEnJeu) => aCapacite(carteDe(composant.numero), 'autonome');

/** Les cibles possibles du renfort d'OpenAPI ou d'AsyncAPI (vide pour les autres cartes). */
export function ciblesDeRenfort(etat: EtatPartie, joueur: IdJoueur, numero: number): string[] {
  const famille = RENFORT.get(numero);
  if (!famille) return [];
  return etat.joueurs[joueur].plateau
    .filter((c) => carteDe(c.numero).famille === famille)
    .map((c) => c.id);
}

function piocherFamille(etat: EtatPartie, joueur: IdJoueur, familles: readonly Famille[]): void {
  const pioche = etat.joueurs[joueur].pioche;
  const index = pioche.findIndex((c) => familles.includes(carteDe(c.numero).famille));
  const [carte] = index >= 0 ? pioche.splice(index, 1) : [];
  if (!carte) return;
  // La carte trouvée passe en tête de pioche, puis la pioche normale s'applique (main pleine comprise).
  pioche.unshift(carte);
  piocher(etat, joueur, 1);
}

/** Effets « quand il est posé » du composant qui vient d'arriver en jeu. */
export function effetsALaPose(
  etat: EtatPartie,
  joueur: IdJoueur,
  pose: ComposantEnJeu,
  cible: string | undefined,
): void {
  const familles = PIOCHE_CIBLEE.get(pose.numero);
  if (familles) piocherFamille(etat, joueur, familles);

  const plateau = etat.joueurs[joueur].plateau;
  const renforce = plateau.find((c) => c.id === cible);
  if (renforce) {
    renforce.bonusAttaque += 1;
    noter(etat, { type: 'statut', joueur, cible: renforce.id, statut: 'bonus-attaque' });
  }

  if (pose.numero === CDC) {
    const fichiers = plateau.filter((c) => carteDe(c.numero).famille === 'fichiers').length;
    piocher(etat, joueur, fichiers);
  }

  // Base vectorielle : vos agents ont +1 PV, à sa pose comme pour les agents posés ensuite.
  const agentsRenforces =
    pose.numero === BASE_VECTORIELLE
      ? plateau.filter(estAgent)
      : [pose].filter((c) => estAgent(c) && actif(etat, joueur, BASE_VECTORIELLE));
  for (const agent of agentsRenforces) {
    agent.pv += 1;
    noter(etat, { type: 'statut', joueur, cible: agent.id, statut: 'bonus-pv' });
  }
}
