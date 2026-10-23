import { melanger, tirerIndex } from './alea.ts';
import {
  adversaire,
  blesserSi,
  carteDe,
  DEBIT_BONUS_SECOND,
  DEBIT_MAX,
  MAIN_DEPART,
  MAIN_MAX,
  noter,
  possede,
  SLA_INITIAL,
  terminer,
  TOURS_MAX,
} from './outils.ts';
import {
  JOUEURS,
  type ComposantEnJeu,
  type EtatJoueur,
  type EtatPartie,
  type IdJoueur,
} from './types.ts';

/** Pioche jusqu'à `nombre` cartes ; une carte qui ne tient pas dans une main pleine part à la défausse. */
export function piocher(etat: EtatPartie, joueur: IdJoueur, nombre: number): void {
  const etatJoueur = etat.joueurs[joueur];
  for (let i = 0; i < nombre; i++) {
    const carte = etatJoueur.pioche.shift();
    if (!carte) return;
    if (etatJoueur.main.length >= MAIN_MAX) {
      etatJoueur.defausse.push(carte);
      noter(etat, { type: 'carte-brulee', joueur, carte });
    } else {
      etatJoueur.main.push(carte);
      noter(etat, { type: 'pioche', joueur, carte, pour: joueur });
    }
  }
}

function payerEntretien(etat: EtatPartie, joueur: IdJoueur): void {
  const etatJoueur = etat.joueurs[joueur];
  for (const composant of etatJoueur.plateau.filter((c) => possede(c, 'sur-site'))) {
    const paye = etatJoueur.debit >= 1;
    if (paye) etatJoueur.debit -= 1;
    composant.entretienImpaye = !paye;
    noter(etat, { type: 'entretien', joueur, carte: composant.id, paye });
  }
}

function superviser(etat: EtatPartie, joueur: IdJoueur): void {
  if (!etat.joueurs[joueur].plateau.some((c) => possede(c, 'supervision'))) return;
  const dessus = etat.joueurs[adversaire(joueur)].pioche[0] ?? null;
  noter(etat, { type: 'supervision', joueur, carte: dessus, pour: joueur });
}

/** Lève les statuts arrivés à échéance (immobilisation, capacités suspendues). */
function expirerStatuts(etat: EtatPartie, composant: ComposantEnJeu): void {
  if (composant.immobiliseJusquAuTour !== null && etat.tour > composant.immobiliseJusquAuTour) {
    composant.immobiliseJusquAuTour = null;
  }
  if (
    composant.sansCapacitesJusquAuTour !== null &&
    etat.tour > composant.sansCapacitesJusquAuTour
  ) {
    composant.sansCapacitesJusquAuTour = null;
  }
}

/** Étapes automatiques d'un début de tour : pioche, Débit, effets « au début de votre tour ». */
export function debuterTour(etat: EtatPartie, joueur: IdJoueur): void {
  etat.actif = joueur;
  const etatJoueur = etat.joueurs[joueur];
  etatJoueur.tours += 1;
  // Le second joueur reçoit un Débit de plus à son premier tour : commencer ne décide plus de la partie (ADR 0026).
  const bonusDebit = joueur !== etat.premier && etatJoueur.tours === 1 ? DEBIT_BONUS_SECOND : 0;
  noter(etat, { type: 'debut-tour', joueur, tour: etat.tour, ...(bonusDebit && { bonusDebit }) });

  for (const id of JOUEURS) {
    for (const composant of etat.joueurs[id].plateau) {
      composant.attaquesSubies = 0;
      composant.reactifUtilise = false;
      expirerStatuts(etat, composant);
    }
  }
  for (const composant of etatJoueur.plateau) {
    composant.aAttaqueCeTour = false;
    composant.entretienImpaye = false;
    composant.delegue = false;
    composant.capacitesEmpruntees = [];
  }

  const premierTourDuPremier = joueur === etat.premier && etatJoueur.tours === 1;
  if (!premierTourDuPremier) piocher(etat, joueur, 1);
  etatJoueur.debit = Math.max(
    0,
    Math.min(etatJoueur.tours + bonusDebit, DEBIT_MAX) - etatJoueur.malusDebit,
  );
  etatJoueur.malusDebit = 0;
  etatJoueur.aDecommissionne = false;
  etatJoueur.cronUtilise = false;
  etatJoueur.delegationUtilisee = false;
  etatJoueur.outillageUtilise = false;
  etatJoueur.cacheUtilise = false;
  etatJoueur.routageUtilise = false;

  const nonConformes = etatJoueur.plateau.filter((c) => possede(c, 'non-conforme')).length;
  if (nonConformes > 0) blesserSi(etat, joueur, nonConformes, 'non-conforme');
  payerEntretien(etat, joueur);
  superviser(etat, joueur);
}

/** Fin du tour du joueur actif : la partie s'arrête après TOURS_MAX tours, sinon l'adversaire joue. */
export function finirTour(etat: EtatPartie): void {
  if (etat.tour >= TOURS_MAX) {
    const { j1, j2 } = etat.joueurs;
    let gagnant: IdJoueur | null = null;
    if (j1.sla !== j2.sla) gagnant = j1.sla > j2.sla ? 'j1' : 'j2';
    terminer(etat, { gagnant, raison: 'tours' });
    return;
  }
  etat.tour += 1;
  debuterTour(etat, adversaire(etat.actif));
}

function nouveauJoueur(joueur: IdJoueur, deck: readonly number[]): EtatJoueur {
  return {
    sla: SLA_INITIAL,
    debit: 0,
    tours: 0,
    pioche: deck.map((numero, i) => {
      carteDe(numero);
      return { id: `${joueur}-${String(i + 1).padStart(2, '0')}`, numero };
    }),
    main: [],
    plateau: [],
    defausse: [],
    aDecommissionne: false,
    fileDurableUtilisee: false,
    parade: false,
    siProtegeJusquAuTour: null,
    malusDebit: 0,
    cronUtilise: false,
    delegationUtilisee: false,
    outillageUtilise: false,
    cacheUtilise: false,
    routageUtilise: false,
  };
}

/**
 * Crée une partie : decks mélangés, 4 cartes en main, premier joueur tiré au sort, premier tour commencé.
 * La même graine et les mêmes decks donnent toujours la même partie (ADR 0013).
 */
export function creerPartie(
  decks: Record<IdJoueur, readonly number[]>,
  graine: number,
): EtatPartie {
  const etat: EtatPartie = {
    joueurs: { j1: nouveauJoueur('j1', decks.j1), j2: nouveauJoueur('j2', decks.j2) },
    premier: 'j1',
    actif: 'j1',
    tour: 1,
    issue: null,
    alea: graine | 0,
    journal: [],
  };
  for (const joueur of JOUEURS) {
    melanger(etat, etat.joueurs[joueur].pioche);
    piocher(etat, joueur, MAIN_DEPART);
  }
  etat.premier = JOUEURS[tirerIndex(etat, 2)] ?? 'j1';
  debuterTour(etat, etat.premier);
  return etat;
}
