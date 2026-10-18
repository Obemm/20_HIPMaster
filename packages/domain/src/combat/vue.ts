import { adversaire } from './outils.ts';
import { actionsPossibles } from './possibles.ts';
import type {
  Action,
  ComposantEnJeu,
  EntreeJournal,
  EtatPartie,
  IdJoueur,
  InstanceCarte,
  Issue,
} from './types.ts';

interface VueCommune {
  sla: number;
  debit: number;
  tours: number;
  plateau: ComposantEnJeu[];
  defausse: InstanceCarte[];
  pioche: number;
}

export interface VueMoi extends VueCommune {
  main: InstanceCarte[];
  aDecommissionne: boolean;
}

export interface VueAdversaire extends VueCommune {
  /** Nombre de cartes en main : leur contenu reste caché. */
  main: number;
}

/** Ce qu'un joueur a le droit de voir d'une partie (ADR 0013). */
export interface VueJoueur {
  joueur: IdJoueur;
  moi: VueMoi;
  adversaire: VueAdversaire;
  actif: IdJoueur;
  tour: number;
  issue: Issue | null;
  journal: EntreeJournal[];
  /** Actions légales, seulement quand c'est son tour. */
  actions: Action[];
}

export function vueDe(etat: EtatPartie, joueur: IdJoueur): VueJoueur {
  const moi = etat.joueurs[joueur];
  const autre = etat.joueurs[adversaire(joueur)];
  const copie = structuredClone({ moi, autre });
  const commun = (j: typeof moi) => ({
    sla: j.sla,
    debit: j.debit,
    tours: j.tours,
    plateau: j.plateau,
    defausse: j.defausse,
    pioche: j.pioche.length,
  });
  return {
    joueur,
    moi: { ...commun(copie.moi), main: copie.moi.main, aDecommissionne: copie.moi.aDecommissionne },
    adversaire: { ...commun(copie.autre), main: copie.autre.main.length },
    actif: etat.actif,
    tour: etat.tour,
    issue: etat.issue ? { ...etat.issue } : null,
    journal: structuredClone(etat.journal.filter((e) => e.pour === undefined || e.pour === joueur)),
    actions: etat.actif === joueur ? actionsPossibles(etat) : [],
  };
}
