import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CompteService } from '../compte/compte.service';
import { MesDuelsService, type ResumeDuel } from './mes-duels.service';

const RESULTATS: Record<NonNullable<ResumeDuel['resultat']>, string> = {
  victoire: 'Victoire',
  defaite: 'Défaite',
  nulle: 'Partie nulle',
};

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
  imports: [RouterLink],
  templateUrl: './mes-duels.html',
})
export class MesDuels {
  protected readonly compte = inject(CompteService);
  private readonly service = inject(MesDuelsService);

  protected readonly resultats = RESULTATS;
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
