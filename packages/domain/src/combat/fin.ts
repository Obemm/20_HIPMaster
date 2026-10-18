import { adversaire, terminer } from './outils.ts';
import type { EtatPartie, IdJoueur } from './types.ts';

/**
 * Termine une partie sans qu'un coup soit joué (US-036) : un joueur abandonne, ou le joueur actif perd par forfait
 * faute d'avoir joué à temps. L'adversaire gagne. Fonction pure : l'état reçu n'est pas modifié, et une partie
 * déjà terminée est renvoyée telle quelle.
 */
export function conceder(
  etat: EtatPartie,
  perdant: IdJoueur,
  raison: 'abandon' | 'forfait',
): EtatPartie {
  if (etat.issue) return etat;
  const suivant = structuredClone(etat);
  terminer(suivant, { gagnant: adversaire(perdant), raison });
  return suivant;
}
