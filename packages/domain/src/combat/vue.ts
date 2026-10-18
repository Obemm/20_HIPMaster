import { adversaire, attaqueEffective } from './outils.ts';
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

/** Un composant tel qu'on le voit sur le plateau, avec son attaque effective (bonus de Hub compris). */
export interface ComposantVisible extends ComposantEnJeu {
  attaque: number;
}

interface VueCommune {
  sla: number;
  debit: number;
  tours: number;
  plateau: ComposantVisible[];
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

/** Les entrées du journal qu'un joueur a le droit de voir (les événements privés de l'adversaire sont retirés). */
export function journalDe(journal: readonly EntreeJournal[], joueur: IdJoueur): EntreeJournal[] {
  return structuredClone(journal.filter((e) => e.pour === undefined || e.pour === joueur));
}

function vueCommune(etat: EtatPartie, joueur: IdJoueur): VueCommune {
  const camp = structuredClone(etat.joueurs[joueur]);
  return {
    sla: camp.sla,
    debit: camp.debit,
    tours: camp.tours,
    plateau: camp.plateau.map((c) => ({ ...c, attaque: attaqueEffective(etat, joueur, c) })),
    defausse: camp.defausse,
    pioche: camp.pioche.length,
  };
}

export function vueDe(etat: EtatPartie, joueur: IdJoueur): VueJoueur {
  const autre = adversaire(joueur);
  const moi = etat.joueurs[joueur];
  return {
    joueur,
    moi: {
      ...vueCommune(etat, joueur),
      main: structuredClone(moi.main),
      aDecommissionne: moi.aDecommissionne,
    },
    adversaire: { ...vueCommune(etat, autre), main: etat.joueurs[autre].main.length },
    actif: etat.actif,
    tour: etat.tour,
    issue: etat.issue ? { ...etat.issue } : null,
    journal: journalDe(etat.journal, joueur),
    actions: etat.actif === joueur ? actionsPossibles(etat) : [],
  };
}
