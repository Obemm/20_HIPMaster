import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CompteService } from '../compte/compte.service';
import { EtatSession } from '../compte/etat-session';
import { ErreurChargement } from '../reseau/erreur-chargement';
import { MesDuelsService, type ResumeDuel } from './mes-duels.service';
import { resteAvant } from './temps';

const RESULTATS: Record<NonNullable<ResumeDuel['resultat']>, string> = {
  victoire: 'Victoire',
  defaite: 'Défaite',
  nulle: 'Partie nulle',
};

/** Précision sur la fin d'un duel : par abandon ou par forfait (US-036) ; rien pour une fin de jeu normale. */
const PRECISIONS: Partial<Record<NonNullable<ResumeDuel['raison']>, string>> = {
  abandon: 'Par abandon',
  forfait: 'Par forfait',
};

/** L'état d'un duel en une pastille (US-068) : un mot, et une couleur qui le double. */
export function etatDuel(duel: ResumeDuel): { libelle: string; classe: string } {
  if (duel.resultat === 'victoire') return { libelle: 'Victoire', classe: 'statut-victoire' };
  if (duel.resultat === 'defaite') return { libelle: 'Défaite', classe: 'statut-defaite' };
  if (duel.resultat) return { libelle: RESULTATS[duel.resultat], classe: 'statut-attente' };
  if (duel.monTour) return { libelle: 'À vous', classe: 'statut-a-jouer' };
  if (duel.statut === 'attente') return { libelle: 'En attente', classe: 'statut-attente' };
  return { libelle: 'Son tour', classe: 'statut-attente' };
}

/** « Il y a 5 min », « il y a 2 h », « il y a 3 j ». */
function depuis(iso: string, maintenant = Date.now()): string {
  const minutes = Math.max(0, Math.round((maintenant - new Date(iso).getTime()) / 60_000));
  if (minutes < 1) return 'à l’instant';
  if (minutes < 60) return `il y a ${minutes} min`;
  const heures = Math.round(minutes / 60);
  return heures < 24 ? `il y a ${heures} h` : `il y a ${Math.round(heures / 24)} j`;
}

/** Page « Mes duels » (US-035) : les duels qui attendent le joueur d'abord. */
@Component({
  selector: 'hip-mes-duels',
  imports: [RouterLink, ErreurChargement, EtatSession],
  templateUrl: './mes-duels.html',
})
export class MesDuels {
  protected readonly compte = inject(CompteService);
  protected readonly service = inject(MesDuelsService);

  protected readonly precisions = PRECISIONS;
  protected readonly etat = etatDuel;
  protected readonly resteAvant = resteAvant;
  protected readonly depuis = depuis;
  protected readonly groupes = computed(() => {
    const duels = this.service.duels();
    if (!duels) return null;
    return [
      {
        id: 'a-vous',
        titre: 'À vous de jouer',
        duels: duels.filter((d) => d.monTour),
      },
      {
        id: 'adversaire',
        titre: 'Au tour de l’adversaire',
        duels: duels.filter((d) => d.statut === 'en-cours' && !d.monTour),
      },
      {
        id: 'attente',
        titre: 'Défis en attente d’un adversaire',
        duels: duels.filter((d) => d.statut === 'attente'),
      },
      { id: 'termines', titre: 'Terminés', duels: duels.filter((d) => d.statut === 'termine') },
    ];
  });
}
