import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CompteService } from '../compte/compte.service';
import { EtatSession } from '../compte/etat-session';
import { ErreurChargement } from '../reseau/erreur-chargement';
import { MesDuelsService, type ResumeDuel } from './mes-duels.service';
import { LOCALE } from '../langue';
import { resteAvant } from './temps';

const RESULTATS: Record<NonNullable<ResumeDuel['resultat']>, string> = {
  victoire: $localize`Victoire`,
  defaite: $localize`Défaite`,
  nulle: $localize`Partie nulle`,
};

/** Précision sur la fin d'un duel : par abandon ou par forfait (US-036) ; rien pour une fin de jeu normale. */
const PRECISIONS: Partial<Record<NonNullable<ResumeDuel['raison']>, string>> = {
  abandon: $localize`Par abandon`,
  forfait: $localize`Par forfait`,
};

/** L'état d'un duel en une pastille (US-068) : un mot, et une couleur qui le double. */
export function etatDuel(duel: ResumeDuel): { libelle: string; classe: string } {
  if (duel.resultat === 'victoire')
    return { libelle: RESULTATS.victoire, classe: 'statut-victoire' };
  if (duel.resultat === 'defaite') return { libelle: RESULTATS.defaite, classe: 'statut-defaite' };
  if (duel.resultat) return { libelle: RESULTATS[duel.resultat], classe: 'statut-attente' };
  if (duel.monTour) return { libelle: $localize`À vous`, classe: 'statut-a-jouer' };
  if (duel.statut === 'attente')
    return { libelle: $localize`En attente`, classe: 'statut-attente' };
  return { libelle: $localize`Son tour`, classe: 'statut-attente' };
}

/** Durées relatives courtes dans la langue du site (US-080) : « il y a 5 min », « 5 min ago ». */
const RELATIF = new Intl.RelativeTimeFormat(LOCALE, { style: 'short' });

/** « Il y a 5 min », « il y a 2 h », « il y a 3 j ». */
function depuis(iso: string, maintenant = Date.now()): string {
  const minutes = Math.max(0, Math.round((maintenant - new Date(iso).getTime()) / 60_000));
  if (minutes < 1) return $localize`à l’instant`;
  if (minutes < 60) return RELATIF.format(-minutes, 'minute');
  const heures = Math.round(minutes / 60);
  return heures < 24
    ? RELATIF.format(-heures, 'hour')
    : RELATIF.format(-Math.round(heures / 24), 'day');
}

/** « Contre Bob », ou « Défi non relevé » tant que personne ne l'a relevé. */
function intitule(duel: ResumeDuel): string {
  return duel.adversaire
    ? $localize`Contre ${duel.adversaire.pseudo}:pseudo:`
    : $localize`Défi non relevé`;
}

/**
 * La ligne sous l'intitulé : « Tour 5 · reste 2 j 1 h · dernier coup il y a 3 min », « Par forfait · dernier coup il y
 * a 2 j ». Composée ici, et non dans le gabarit, pour garder ses espaces quel que soit le texte traduit (US-080).
 */
function detail(duel: ResumeDuel, maintenant = Date.now()): string {
  const parties: string[] = [];
  if (duel.resultat) {
    const precision = duel.raison ? PRECISIONS[duel.raison] : undefined;
    if (precision) parties.push(precision);
  } else if (duel.tour) {
    parties.push($localize`Tour ${duel.tour}:tour:`);
    const reste = resteAvant(duel.echeance, maintenant);
    if (reste) parties.push($localize`reste ${reste}:duree:`);
  }
  const quand = depuis(duel.majLe, maintenant);
  parties.push(
    duel.statut === 'attente'
      ? $localize`lancé ${quand}:depuis:`
      : $localize`dernier coup ${quand}:depuis:`,
  );
  return parties.join(' · ');
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

  protected readonly etat = etatDuel;
  protected readonly intitule = intitule;
  protected readonly detail = detail;
  protected readonly groupes = computed(() => {
    const duels = this.service.duels();
    if (!duels) return null;
    return [
      {
        id: 'a-vous',
        titre: $localize`À vous de jouer`,
        duels: duels.filter((d) => d.monTour),
      },
      {
        id: 'adversaire',
        titre: $localize`Au tour de l’adversaire`,
        duels: duels.filter((d) => d.statut === 'en-cours' && !d.monTour),
      },
      {
        id: 'attente',
        titre: $localize`Défis en attente d’un adversaire`,
        duels: duels.filter((d) => d.statut === 'attente'),
      },
      {
        id: 'termines',
        titre: $localize`Terminés`,
        duels: duels.filter((d) => d.statut === 'termine'),
      },
    ];
  });
}
