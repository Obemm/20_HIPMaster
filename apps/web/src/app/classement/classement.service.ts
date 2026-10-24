import { HttpClient } from '@angular/common/http';
import { effect, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { CompteService } from '../compte/compte.service';
import { LANGUE } from '../langue';

/** Le score d'un joueur ; `cote` vaut `null` tant qu'aucun duel n'est compté. */
export interface Score {
  pseudo: string;
  points: number;
  cote: number | null;
}

/** Le classement vu par le joueur connecté (US-069, contrat `classement.yaml`). */
export interface Classement {
  moi: Score & { rang: number | null; classe: boolean };
  joueurs: (Score & { rang: number; moi: boolean })[];
}

/** Suffixes des ordinaux anglais, selon la règle d'`Intl` (« 1st », « 2nd », « 3rd », « 11th »…). */
const SUFFIXES_EN: Readonly<Record<string, string>> = {
  one: 'st',
  two: 'nd',
  few: 'rd',
  other: 'th',
};
const ORDINAUX_EN = new Intl.PluralRules('en', { type: 'ordinal' });

/** « 1er », « 2e »… ; « 1st », « 2nd »… dans la version anglaise (US-080). */
export const ordinal = (rang: number): string => {
  if (LANGUE === 'en') return `${rang}${SUFFIXES_EN[ORDINAUX_EN.select(rang)] ?? 'th'}`;
  return rang === 1 ? '1er' : `${rang}e`;
};

/**
 * Score et classement du joueur connecté (US-069). Le serveur les calcule (ADR 0004, 0044) : le front ne fait que les
 * lire. Lu par l'accueil et à l'ouverture de la page (il bouge sans cesse), oublié à la déconnexion.
 */
@Injectable({ providedIn: 'root' })
export class ClassementService {
  private readonly http = inject(HttpClient);
  private readonly compte = inject(CompteService);

  /** `null` tant qu'il n'est pas chargé (ou sans compte). */
  readonly classement = signal<Classement | null>(null);
  readonly enCours = signal(false);
  /** L'échec de la dernière lecture ; `null` si elle a réussi. */
  readonly erreur = signal<unknown>(null);

  constructor() {
    effect(() => {
      if (!this.compte.joueur()) {
        this.classement.set(null);
        this.erreur.set(null);
      }
    });
  }

  async charger(): Promise<void> {
    this.enCours.set(true);
    try {
      this.classement.set(await firstValueFrom(this.http.get<Classement>('/api/v1/classement')));
      this.erreur.set(null);
    } catch (erreur) {
      this.erreur.set(erreur);
    } finally {
      this.enCours.set(false);
    }
  }

  /** Se retirer du classement (`false`), ou y revenir ; puis relit le classement. */
  async changer(classe: boolean): Promise<void> {
    await firstValueFrom(this.http.put('/api/v1/moi/classement', { classe }));
    await this.charger();
  }
}
