import { adversaire } from './outils.ts';
import type { ComposantEnJeu, EtatJoueur, EtatPartie, InstanceCarte } from './types.ts';
import type { ComposantVisible, VueJoueur } from './vue.ts';

/**
 * Reconstitue un état de partie à partir de la seule vue d'un joueur, pour que les bots évaluent leurs actions avec
 * le moteur sans tricher (US-021). Les cartes cachées (main et pioche adverses, ma propre pioche) sont remplacées
 * par des cartes neutres ; les marqueurs inconnus de l'adversaire prennent leur valeur par défaut. Le hasard repart
 * d'une graine fixe : les effets aléatoires sont donc estimés, pas prédits.
 */

/** Carte neutre qui tient la place d'une carte cachée : un Fichier CSV. */
const CARTE_NEUTRE = 4;
const GRAINE_ESTIMATION = 20_261_018;

const neutres = (prefixe: string, nombre: number): InstanceCarte[] =>
  Array.from({ length: nombre }, (_, i) => ({ id: `${prefixe}-${i}`, numero: CARTE_NEUTRE }));

/** Retire l'attaque calculée par la vue : le moteur la recalcule. */
function versComposant(visible: ComposantVisible): ComposantEnJeu {
  const copie: ComposantEnJeu & { attaque?: number } = structuredClone(visible);
  delete copie.attaque;
  return copie;
}

const MARQUEURS_PAR_DEFAUT = {
  fileDurableUtilisee: false,
  parade: false,
  siProtegeJusquAuTour: null,
  malusDebit: 0,
  cronUtilise: false,
  delegationUtilisee: false,
  outillageUtilise: false,
  cacheUtilise: false,
  routageUtilise: false,
} satisfies Partial<EtatJoueur>;

export function reconstituer(vue: VueJoueur): EtatPartie {
  const { moi, adversaire: autre } = vue;
  const joueurMoi: EtatJoueur = {
    ...MARQUEURS_PAR_DEFAUT,
    ...structuredClone(moi.marqueurs),
    sla: moi.sla,
    debit: moi.debit,
    tours: moi.tours,
    pioche: neutres('pioche-moi', moi.pioche),
    main: structuredClone(moi.main),
    plateau: moi.plateau.map(versComposant),
    defausse: structuredClone(moi.defausse),
    aDecommissionne: moi.aDecommissionne,
  };
  const joueurAutre: EtatJoueur = {
    ...MARQUEURS_PAR_DEFAUT,
    sla: autre.sla,
    debit: autre.debit,
    tours: autre.tours,
    pioche: neutres('pioche-adverse', autre.pioche),
    main: neutres('main-adverse', autre.main),
    plateau: autre.plateau.map(versComposant),
    defausse: structuredClone(autre.defausse),
    aDecommissionne: false,
  };
  const idAutre = adversaire(vue.joueur);
  return {
    joueurs:
      vue.joueur === 'j1' ? { j1: joueurMoi, j2: joueurAutre } : { j1: joueurAutre, j2: joueurMoi },
    premier: idAutre,
    actif: vue.actif,
    tour: vue.tour,
    issue: vue.issue ? { ...vue.issue } : null,
    alea: GRAINE_ESTIMATION,
    journal: [],
  };
}
