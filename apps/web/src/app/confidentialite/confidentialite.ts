import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Une durée de conservation. */
export interface Conservation {
  donnees: string;
  duree: string;
}

/**
 * Durées de conservation (US-053, ADR 0031). Décision du porteur du projet : les comptes, collections, récompenses et
 * résultats sont gardés sans limite, sauf suppression par le joueur ; seules des données techniques expirent, effacées
 * chaque nuit par la purge (US-054, ADR 0035). Changer une durée ici, c'est changer la purge, et inversement.
 */
export const CONSERVATIONS: readonly Conservation[] = [
  {
    donnees: 'Votre compte, votre collection, vos récompenses et vos résultats',
    duree: 'sans limite, jusqu’à ce que vous supprimiez votre compte',
  },
  {
    donnees: 'Une session inutilisée (il suffit ensuite de se reconnecter avec son code)',
    duree: '90 jours sans utilisation',
  },
  {
    donnees: 'Une partie contre le bot abandonnée (une récompense gagnée reste acquise)',
    duree: '24 heures sans coup joué',
  },
  { donnees: 'Un défi jamais accepté', duree: '7 jours' },
  { donnees: 'Les journaux techniques (adresses IP comprises)', duree: '30 jours au plus' },
  { donnees: 'Les sauvegardes de la base', duree: '30 jours au plus' },
  { donnees: 'Les compteurs anti-abus (adresse IP)', duree: 'une heure au plus, en mémoire' },
];

/** Page « À propos et confidentialité » (US-053) : qui édite le jeu, ce qu'il garde, pourquoi, combien de temps. */
@Component({
  selector: 'hip-confidentialite',
  imports: [RouterLink],
  templateUrl: './confidentialite.html',
})
export class ConfidentialiteEcran {
  protected readonly conservations = CONSERVATIONS;
}
