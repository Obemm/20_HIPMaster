import type { Evenement, IdJoueur } from './modele';

/** Donne le nom d'une carte à partir de son identifiant dans la partie (« j2-05 »). */
export type NommerCarte = (id: string) => string;

/** Identifiant de la carte d'un événement, quelle que soit sa forme. */
function idCarte(e: Evenement): string | null {
  if (!e.carte) return null;
  return typeof e.carte === 'string' ? e.carte : e.carte.id;
}

const quiFait = (
  joueur: IdJoueur | undefined,
  moi: IdJoueur,
  verbeMoi: string,
  verbeBot: string,
) => (joueur === moi ? `Vous ${verbeMoi}` : `Le bot ${verbeBot}`);

function cibleDe(evenement: Evenement, moi: IdJoueur, nommer: NommerCarte): string {
  if (evenement.cible !== 'si') return nommer(evenement.cible ?? '');
  return evenement.joueur === moi ? 'le SI du bot' : 'votre SI';
}

const CAUSES: Record<string, string> = {
  couplage: ' (Couplage fort)',
  riposte: ' (riposte)',
  diffusion: ' (Diffusion)',
  reactif: ' (Réactif)',
  'point-unique': ' (Point unique)',
  'non-conforme': ' (Non conforme)',
};

function decrireDegats(e: Evenement, moi: IdJoueur, nommer: NommerCarte): string {
  const cause = CAUSES[e.cause ?? ''] ?? '';
  if (e.cible === 'si') {
    const si = e.joueur === moi ? 'Votre SI' : 'Le SI du bot';
    return `${si} perd ${e.montant} SLA${cause}.`;
  }
  return `${nommer(e.cible ?? '')} subit ${e.montant} dégât${(e.montant ?? 0) > 1 ? 's' : ''}${cause}.`;
}

/** Le SI du point de vue du joueur : `pourMoi` vaut vrai si c'est le SI du joueur. */
const nomSi = (pourMoi: boolean) => (pourMoi ? 'votre SI' : 'le SI du bot');

function decrireJeu(e: Evenement, moi: IdJoueur, nommer: NommerCarte, carte: string): string {
  const cibles = (e.cibles ?? []).map((id) => (id === 'si' ? nomSi(e.joueur !== moi) : nommer(id)));
  const sur = cibles.length > 0 ? ` sur ${cibles.join(' et ')}` : '';
  return `${quiFait(e.joueur, moi, 'jouez', 'joue')} ${carte}${sur}.`;
}

/** Les statuts posés par les sorts et les incidents (US-014). */
function decrireStatut(e: Evenement, moi: IdJoueur, nommer: NommerCarte): string | null {
  const nom = nommer(e.cible ?? '');
  const pourMoi = e.joueur === moi;
  switch (e.statut) {
    case 'immobilise':
      return `${nom} est immobilisé : pas d’attaque à son prochain tour.`;
    case 'sans-capacites':
      return `${nom} perd ses capacités jusqu’à la fin de son prochain tour.`;
    case 'doublon':
      return `${nom} subira le double de son prochain dégât (Doublon).`;
    case 'doublon-annule':
      return `Doublon annulé sur ${nom}.`;
    case 'attaque-nulle':
      return `La prochaine attaque de ${nom} n’infligera aucun dégât.`;
    case 'couplage':
      return `${nom} est couplé : il partage ses dégâts.`;
    case 'bonus-attaque':
      return `${nom} gagne en attaque.`;
    case 'bonus-pv':
      return `${nom} gagne 1 PV.`;
    case 'attaque-a-nouveau':
      return `${nom} peut attaquer de nouveau.`;
    case 'protection-si':
      return `${pourMoi ? 'Votre SI est protégé' : 'Le SI du bot est protégé'} jusqu’au prochain tour (Circuit Breaker).`;
    case 'parade':
      return `Le prochain incident contre ${pourMoi ? 'vous' : 'le bot'} sera sans effet (Human-in-the-loop).`;
    case 'malus-debit':
      return `${pourMoi ? 'Vous aurez' : 'Le bot aura'} 2 Débit de moins au prochain tour (Facture de tokens).`;
    default:
      return null;
  }
}

function decrireFin(e: Evenement, moi: IdJoueur): string {
  if (!e.issue) return 'Fin de la partie.';
  if (e.issue.gagnant === null) return 'Fin de la partie : égalité.';
  return e.issue.gagnant === moi
    ? 'Fin de la partie : vous gagnez !'
    : 'Fin de la partie : le bot gagne.';
}

/**
 * Traduit un événement en phrase, du point de vue du joueur `moi` ; `null` pour un événement sans intérêt à
 * l'écran. Les noms de cartes viennent du catalogue.
 */
export function decrireEvenement(e: Evenement, moi: IdJoueur, nommer: NommerCarte): string | null {
  const id = idCarte(e);
  const carte = id ? nommer(id) : '';
  switch (e.type) {
    case 'debut-tour':
      return e.joueur === moi
        ? `Tour ${e.tour} : à vous de jouer.`
        : `Tour ${e.tour} : le bot joue.`;
    case 'pioche':
      return e.joueur === moi ? `Vous piochez ${carte}.` : null;
    case 'carte-brulee':
      return `${quiFait(e.joueur, moi, 'défaussez', 'défausse')} ${carte} : main pleine.`;
    case 'pose':
      return `${quiFait(e.joueur, moi, 'posez', 'pose')} ${carte}.`;
    case 'evolution':
      return `${quiFait(e.joueur, moi, 'faites évoluer', 'fait évoluer')} ${nommer(e.origine?.id ?? '')} en ${carte}.`;
    case 'decommission':
      return `${quiFait(e.joueur, moi, 'décommissionnez', 'décommissionne')} ${carte} (+${e.debit} Débit).`;
    case 'attaque':
      return `${nommer(e.attaquant ?? '')} attaque ${cibleDe(e, moi, nommer)}.`;
    case 'degats':
      return decrireDegats(e, moi, nommer);
    case 'destruction':
      return `Destruction : ${carte}.`;
    case 'retour-main':
      return `${carte} revient en main (File durable).`;
    case 'entretien':
      return e.paye ? null : `${carte} : entretien impayé, pas d’attaque ce tour.`;
    case 'supervision':
      return id ? `Supervision : la prochaine carte du bot est ${carte}.` : null;
    case 'jeu':
      return decrireJeu(e, moi, nommer, carte);
    case 'parade':
      return `${carte} est sans effet (Human-in-the-loop).`;
    case 'statut':
      return decrireStatut(e, moi, nommer);
    case 'rappel':
      return `${carte} revient en jeu avec 1 PV (Dead Letter Queue).`;
    case 'outillage':
      return `Outillage : ${e.joueur === moi ? 'vos agents prennent' : 'les agents du bot prennent'} les capacités de ${nommer(e.source ?? '')}.`;
    case 'routage':
      return `Routage multi-modèles : ${nommer(e.retour?.id ?? '')} revient en main, ${carte} prend sa place.`;
    case 'migration':
      return `Migration : ${nommer(e.origine?.id ?? '')} est remplacé par ${carte}.`;
    case 'si-protege':
      return `${e.joueur === moi ? 'Votre SI' : 'Le SI du bot'} ne perd aucun SLA (Circuit Breaker).`;
    case 'fin-partie':
      return decrireFin(e, moi);
    default:
      return null;
  }
}
