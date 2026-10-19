import { adversaire, attaqueEffective, raisonDeNePasAttaquer } from './outils.ts';
import { actionsPossibles } from './possibles.ts';
import type {
  Action,
  ComposantEnJeu,
  EntreeJournal,
  EtatJoueur,
  EtatPartie,
  IdJoueur,
  InstanceCarte,
  Issue,
} from './types.ts';

/** Un composant tel qu'on le voit sur le plateau, avec son attaque effective (bonus de Hub compris). */
export interface ComposantVisible extends ComposantEnJeu {
  attaque: number;
  /**
   * Pourquoi ce composant ne peut pas attaquer maintenant (US-041) ; `null` s'il le peut. Seulement pour ses propres
   * composants, pendant son tour : c'est le serveur qui explique, l'écran ne fait qu'afficher (ADR 0004).
   */
  sansAttaque?: string | null;
}

interface VueCommune {
  sla: number;
  debit: number;
  tours: number;
  plateau: ComposantVisible[];
  defausse: InstanceCarte[];
  pioche: number;
}

/** Les marqueurs du joueur (usages « une fois par tour », protections) : il les connaît, pas son adversaire. */
export type MarqueursJoueur = Pick<
  EtatJoueur,
  | 'fileDurableUtilisee'
  | 'parade'
  | 'siProtegeJusquAuTour'
  | 'malusDebit'
  | 'cronUtilise'
  | 'delegationUtilisee'
  | 'outillageUtilise'
  | 'cacheUtilise'
  | 'routageUtilise'
>;

export interface VueMoi extends VueCommune {
  main: InstanceCarte[];
  aDecommissionne: boolean;
  marqueurs: MarqueursJoueur;
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
  const commune = vueCommune(etat, joueur);
  const plateau =
    etat.actif === joueur && !etat.issue
      ? commune.plateau.map((c) => ({ ...c, sansAttaque: raisonDeNePasAttaquer(etat, joueur, c) }))
      : commune.plateau;
  return {
    joueur,
    moi: {
      ...commune,
      plateau,
      main: structuredClone(moi.main),
      aDecommissionne: moi.aDecommissionne,
      marqueurs: {
        fileDurableUtilisee: moi.fileDurableUtilisee,
        parade: moi.parade,
        siProtegeJusquAuTour: moi.siProtegeJusquAuTour,
        malusDebit: moi.malusDebit,
        cronUtilise: moi.cronUtilise,
        delegationUtilisee: moi.delegationUtilisee,
        outillageUtilise: moi.outillageUtilise,
        cacheUtilise: moi.cacheUtilise,
        routageUtilise: moi.routageUtilise,
      },
    },
    adversaire: { ...vueCommune(etat, autre), main: etat.joueurs[autre].main.length },
    actif: etat.actif,
    tour: etat.tour,
    issue: etat.issue ? { ...etat.issue } : null,
    journal: journalDe(etat.journal, joueur),
    actions: etat.actif === joueur ? actionsPossibles(etat) : [],
  };
}
