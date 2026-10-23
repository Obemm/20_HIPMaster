import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Une durée de conservation ; `aVenir` : annoncée, mais pas encore appliquée (purge d'US-054). */
export interface Conservation {
  donnees: string;
  duree: string;
  aVenir?: true;
}

/**
 * Durées de conservation (US-053, ADR 0031). Décision du porteur du projet : les comptes, collections, récompenses et
 * résultats sont gardés sans limite, sauf suppression par le joueur ; seules des données techniques expirent. Celles
 * marquées `aVenir` seront appliquées par la purge d'US-054 : la page le dit, pour ne rien promettre de faux.
 */
export const CONSERVATIONS: readonly Conservation[] = [
  {
    donnees: 'Votre compte, votre collection, vos récompenses et vos résultats',
    duree: 'sans limite, jusqu’à ce que vous supprimiez votre compte',
  },
  {
    donnees: 'Une session inutilisée (il suffit ensuite de se reconnecter avec son code)',
    duree: '90 jours sans utilisation',
    aVenir: true,
  },
  {
    donnees: 'Une partie contre le bot abandonnée (une récompense gagnée reste acquise)',
    duree: '24 heures sans coup joué',
  },
  { donnees: 'Un défi jamais accepté', duree: '7 jours', aVenir: true },
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
  protected readonly aVenir = CONSERVATIONS.some((c) => c.aVenir);
}
