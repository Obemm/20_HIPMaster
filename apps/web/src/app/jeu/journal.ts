import { LOCALE } from '../langue';
import type { Evenement, IdJoueur } from './modele';

/** Donne le nom d'une carte à partir de son identifiant dans la partie (« j2-05 »). */
export type NommerCarte = (id: string) => string;

/**
 * Comment le journal désigne l'adversaire : le bot, ou le pseudo d'un joueur en duel (US-034). Les champs sont déjà
 * traduits dans la langue du site (US-080) ; ils se glissent comme placeholders dans une phrase entière, que chaque
 * langue ordonne à sa façon (« le SI {$de} » → « {$de} System »).
 */
export interface Adversaire {
  /** Le pseudo du joueur en duel ; `null` pour le bot. */
  pseudo: string | null;
  /** En début de phrase : « Le bot », « Ada » (« The bot », « Ada »). */
  sujet: string;
  /** Dans la phrase : « le bot », « Ada » (« the bot », « Ada »). */
  nom: string;
  /**
   * Complément du nom, à placer selon la langue : « du bot », « d’Ada », « de Bob » en français (après le nom),
   * « the bot’s », « Ada’s » en anglais (avant le nom). Jamais en début de phrase : en anglais, « the bot’s » y
   * garderait sa minuscule.
   */
  de: string;
}

export const BOT: Adversaire = {
  pseudo: null,
  sujet: $localize`Le bot`,
  nom: $localize`le bot`,
  de: $localize`du bot`,
};

/** L'adversaire d'un duel, désigné par son pseudo, avec l'élision devant une voyelle (« d’Ada »). */
export function adversaireNomme(pseudo: string): Adversaire {
  const elision = /^[aeiouyhàâäéèêëîïôöùûü]/i.test(pseudo);
  return {
    pseudo,
    sujet: pseudo,
    nom: pseudo,
    de: elision ? $localize`d’${pseudo}:pseudo:` : $localize`de ${pseudo}:pseudo:`,
  };
}

/** Identifiant de la carte d'un événement, quelle que soit sa forme. */
function idCarte(e: Evenement): string | null {
  if (!e.carte) return null;
  return typeof e.carte === 'string' ? e.carte : e.carte.id;
}

/** Le SI au milieu d'une phrase, du point de vue du joueur : `pourMoi` vaut vrai si c'est le SI du joueur. */
const nomSi = (pourMoi: boolean, autre: Adversaire) =>
  pourMoi ? $localize`votre SI` : $localize`le SI ${autre.de}:adversaire:`;

/** La cause de dégâts, entre parenthèses après la phrase (capacités et cartes) ; vide sans cause connue. */
function cause(code: string | undefined): string {
  const causes: Record<string, string> = {
    couplage: $localize`Couplage fort`,
    riposte: $localize`riposte`,
    diffusion: $localize`Diffusion`,
    reactif: $localize`Réactif`,
    'point-unique': $localize`Point unique`,
    'non-conforme': $localize`Non conforme`,
  };
  const nom = causes[code ?? ''];
  return nom ? ` (${nom})` : '';
}

function decrireDegats(
  e: Evenement,
  moi: IdJoueur,
  nommer: NommerCarte,
  autre: Adversaire,
): string {
  const suffixe = cause(e.cause);
  const montant = e.montant ?? 0;
  if (e.cible === 'si') {
    if (e.joueur === moi) return $localize`Votre SI perd ${montant}:montant: SLA${suffixe}:cause:.`;
    return autre.pseudo === null
      ? $localize`Le SI du bot perd ${montant}:montant: SLA${suffixe}:cause:.`
      : $localize`Le SI ${autre.de}:adversaire: perd ${montant}:montant: SLA${suffixe}:cause:.`;
  }
  const carte = nommer(e.cible ?? '');
  return montant > 1
    ? $localize`${carte}:carte: subit ${montant}:montant: dégâts${suffixe}:cause:.`
    : $localize`${carte}:carte: subit ${montant}:montant: dégât${suffixe}:cause:.`;
}

function decrireJeu(
  e: Evenement,
  moi: IdJoueur,
  nommer: NommerCarte,
  carte: string,
  autre: Adversaire,
): string {
  const cibles = (e.cibles ?? []).map((id) =>
    id === 'si' ? nomSi(e.joueur !== moi, autre) : nommer(id),
  );
  if (cibles.length === 0) {
    return e.joueur === moi
      ? $localize`Vous jouez ${carte}:carte:.`
      : $localize`${autre.sujet}:adversaire: joue ${carte}:carte:.`;
  }
  // « Topic et votre SI », « Topic and your System » : la conjonction suit la langue du site.
  const sur = new Intl.ListFormat(LOCALE, { type: 'conjunction' }).format(cibles);
  return e.joueur === moi
    ? $localize`Vous jouez ${carte}:carte: sur ${sur}:cibles:.`
    : $localize`${autre.sujet}:adversaire: joue ${carte}:carte: sur ${sur}:cibles:.`;
}

/** « Votre SI est protégé… », « Le SI du bot est protégé… », « Le SI d’Ada est protégé… ». */
function decrireProtectionSi(pourMoi: boolean, autre: Adversaire): string {
  if (pourMoi) return $localize`Votre SI est protégé jusqu’au prochain tour (Circuit Breaker).`;
  return autre.pseudo === null
    ? $localize`Le SI du bot est protégé jusqu’au prochain tour (Circuit Breaker).`
    : $localize`Le SI ${autre.de}:adversaire: est protégé jusqu’au prochain tour (Circuit Breaker).`;
}

/** « Votre SI ne perd aucun SLA… », du point de vue du joueur. */
function decrireSiProtege(pourMoi: boolean, autre: Adversaire): string {
  if (pourMoi) return $localize`Votre SI ne perd aucun SLA (Circuit Breaker).`;
  return autre.pseudo === null
    ? $localize`Le SI du bot ne perd aucun SLA (Circuit Breaker).`
    : $localize`Le SI ${autre.de}:adversaire: ne perd aucun SLA (Circuit Breaker).`;
}

/** Les statuts posés par les sorts et les incidents (US-014). */
function decrireStatut(
  e: Evenement,
  moi: IdJoueur,
  nommer: NommerCarte,
  autre: Adversaire,
): string | null {
  const nom = nommer(e.cible ?? '');
  const pourMoi = e.joueur === moi;
  switch (e.statut) {
    case 'immobilise':
      return $localize`${nom}:carte: est immobilisé : pas d’attaque à son prochain tour.`;
    case 'sans-capacites':
      return $localize`${nom}:carte: perd ses capacités jusqu’à la fin de son prochain tour.`;
    case 'doublon':
      return $localize`${nom}:carte: subira le double de son prochain dégât (Doublon).`;
    case 'doublon-annule':
      return $localize`Doublon annulé sur ${nom}:carte:.`;
    case 'attaque-nulle':
      return $localize`La prochaine attaque de ${nom}:carte: n’infligera aucun dégât.`;
    case 'couplage':
      return $localize`${nom}:carte: est couplé : il partage ses dégâts.`;
    case 'bonus-attaque':
      return $localize`${nom}:carte: gagne en attaque.`;
    case 'bonus-pv':
      return $localize`${nom}:carte: gagne 1 PV.`;
    case 'attaque-a-nouveau':
      return $localize`${nom}:carte: peut attaquer de nouveau.`;
    case 'protection-si':
      return decrireProtectionSi(pourMoi, autre);
    case 'parade':
      return pourMoi
        ? $localize`Le prochain incident contre vous sera sans effet (Human-in-the-loop).`
        : $localize`Le prochain incident contre ${autre.nom}:adversaire: sera sans effet (Human-in-the-loop).`;
    case 'malus-debit':
      return pourMoi
        ? $localize`Vous aurez 2 Débit de moins au prochain tour (Facture de tokens).`
        : $localize`${autre.sujet}:adversaire: aura 2 Débit de moins au prochain tour (Facture de tokens).`;
    default:
      return null;
  }
}

function decrireFin(e: Evenement, moi: IdJoueur, autre: Adversaire): string {
  if (!e.issue) return $localize`Fin de la partie.`;
  if (e.issue.gagnant === null) return $localize`Fin de la partie : égalité.`;
  return e.issue.gagnant === moi
    ? $localize`Fin de la partie : vous gagnez !`
    : $localize`Fin de la partie : ${autre.nom}:adversaire: gagne.`;
}

/** Début de tour, avec le Débit de plus du second joueur à son premier tour (ADR 0026). */
function decrireDebutTour(e: Evenement, moi: IdJoueur, autre: Adversaire): string {
  const tour = e.tour;
  const bonus = e.bonusDebit;
  if (e.joueur === moi) {
    return bonus
      ? $localize`Tour ${tour}:tour: : à vous de jouer. Vous jouez en second : ${bonus}:bonus: Débit de plus à ce premier tour.`
      : $localize`Tour ${tour}:tour: : à vous de jouer.`;
  }
  return bonus
    ? $localize`Tour ${tour}:tour: : ${autre.nom}:adversaire: joue (en second, ${bonus}:bonus: Débit de plus à ce premier tour).`
    : $localize`Tour ${tour}:tour: : ${autre.nom}:adversaire: joue.`;
}

/** Les actions d'un joueur sur ses cartes : « Vous posez… » ou « Le bot pose… ». */
function decrireAction(
  e: Evenement,
  moi: IdJoueur,
  nommer: NommerCarte,
  carte: string,
  autre: Adversaire,
): string | null {
  const parMoi = e.joueur === moi;
  const qui = autre.sujet;
  switch (e.type) {
    case 'pioche':
      return parMoi ? $localize`Vous piochez ${carte}:carte:.` : null;
    case 'carte-brulee':
      return parMoi
        ? $localize`Vous défaussez ${carte}:carte: : main pleine.`
        : $localize`${qui}:adversaire: défausse ${carte}:carte: : main pleine.`;
    case 'pose':
      return parMoi
        ? $localize`Vous posez ${carte}:carte:.`
        : $localize`${qui}:adversaire: pose ${carte}:carte:.`;
    case 'evolution': {
      const origine = nommer(e.origine?.id ?? '');
      return parMoi
        ? $localize`Vous faites évoluer ${origine}:origine: en ${carte}:carte:.`
        : $localize`${qui}:adversaire: fait évoluer ${origine}:origine: en ${carte}:carte:.`;
    }
    case 'decommission': {
      const debit = e.debit;
      return parMoi
        ? $localize`Vous décommissionnez ${carte}:carte: (+${debit}:debit: Débit).`
        : $localize`${qui}:adversaire: décommissionne ${carte}:carte: (+${debit}:debit: Débit).`;
    }
    case 'outillage': {
      const source = nommer(e.source ?? '');
      return parMoi
        ? $localize`Outillage : vos agents prennent les capacités de ${source}:source:.`
        : $localize`Outillage : les agents ${autre.de}:adversaire: prennent les capacités de ${source}:source:.`;
    }
    default:
      return null;
  }
}

/**
 * Traduit un événement en phrase, du point de vue du joueur `moi` ; `null` pour un événement sans intérêt à
 * l'écran. Les noms de cartes viennent du catalogue.
 */
export function decrireEvenement(
  e: Evenement,
  moi: IdJoueur,
  nommer: NommerCarte,
  autre: Adversaire = BOT,
): string | null {
  const id = idCarte(e);
  const carte = id ? nommer(id) : '';
  switch (e.type) {
    case 'debut-tour':
      return decrireDebutTour(e, moi, autre);
    case 'pioche':
    case 'carte-brulee':
    case 'pose':
    case 'evolution':
    case 'decommission':
    case 'outillage':
      return decrireAction(e, moi, nommer, carte, autre);
    case 'attaque': {
      const attaquant = nommer(e.attaquant ?? '');
      const cible = e.cible === 'si' ? nomSi(e.joueur !== moi, autre) : nommer(e.cible ?? '');
      return $localize`${attaquant}:attaquant: attaque ${cible}:cible:.`;
    }
    case 'degats':
      return decrireDegats(e, moi, nommer, autre);
    case 'destruction':
      return $localize`Destruction : ${carte}:carte:.`;
    case 'retour-main':
      return $localize`${carte}:carte: revient en main (File durable).`;
    case 'entretien':
      return e.paye ? null : $localize`${carte}:carte: : entretien impayé, pas d’attaque ce tour.`;
    case 'supervision':
      return id
        ? $localize`Supervision : la prochaine carte ${autre.de}:adversaire: est ${carte}:carte:.`
        : null;
    case 'jeu':
      return decrireJeu(e, moi, nommer, carte, autre);
    case 'parade':
      return $localize`${carte}:carte: est sans effet (Human-in-the-loop).`;
    case 'statut':
      return decrireStatut(e, moi, nommer, autre);
    case 'rappel':
      return $localize`${carte}:carte: revient en jeu avec 1 PV (Dead Letter Queue).`;
    case 'routage': {
      const retour = nommer(e.retour?.id ?? '');
      return $localize`Routage multi-modèles : ${retour}:retour: revient en main, ${carte}:carte: prend sa place.`;
    }
    case 'migration': {
      const origine = nommer(e.origine?.id ?? '');
      return $localize`Migration : ${origine}:origine: est remplacé par ${carte}:carte:.`;
    }
    case 'si-protege':
      return decrireSiProtege(e.joueur === moi, autre);
    case 'fin-partie':
      return decrireFin(e, moi, autre);
    default:
      return null;
  }
}
