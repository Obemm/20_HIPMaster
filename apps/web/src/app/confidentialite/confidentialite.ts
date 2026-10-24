import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Une durée de conservation. */
export interface Conservation {
  donnees: string;
  duree: string;
}

/**
 * Durées de conservation (US-053, ADR 0031). Décision du porteur du projet : les comptes, collections, récompenses,
 * résultats et scores (US-069) sont gardés sans limite, sauf suppression par le joueur ; seules des données techniques expirent, effacées
 * chaque nuit par la purge (US-054, ADR 0035). Changer une durée ici, c'est changer la purge, et inversement.
 */
export const CONSERVATIONS: readonly Conservation[] = [
  {
    donnees: $localize`Votre compte, votre collection, vos récompenses, vos résultats et votre score`,
    duree: $localize`sans limite, jusqu’à ce que vous supprimiez votre compte`,
  },
  {
    donnees: $localize`Une session inutilisée (il suffit ensuite de se reconnecter avec son code)`,
    duree: $localize`90 jours sans utilisation`,
  },
  {
    donnees: $localize`Une partie contre le bot abandonnée (une récompense gagnée reste acquise)`,
    duree: $localize`24 heures sans coup joué`,
  },
  { donnees: $localize`Un défi jamais accepté`, duree: $localize`7 jours` },
  {
    donnees: $localize`Les journaux techniques (adresses IP comprises)`,
    duree: $localize`30 jours au plus`,
  },
  { donnees: $localize`Les sauvegardes de la base`, duree: $localize`30 jours au plus` },
  {
    donnees: $localize`Les compteurs anti-abus (adresse IP)`,
    duree: $localize`une heure au plus, en mémoire`,
  },
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
