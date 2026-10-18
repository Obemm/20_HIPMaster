/** Identifiants des capacités du glossaire (docs/produit/regles.md). Leurs effets relèvent du moteur de combat. */
export const IDS_CAPACITE = [
  'batch',
  'veteran',
  'non-conforme',
  'sur-site',
  'hub',
  'point-unique',
  'garde',
  'quotas',
  'connecteur',
  'diffusion',
  'reactif',
  'file-durable',
  'supervision',
  'migration',
  'autonome',
  'orchestration',
  'outillage',
  'delegation',
  'contexte',
  'garde-fous',
  'asynchrone',
  'cache-semantique',
  'routage-multi-modeles',
] as const;
export type IdCapacite = (typeof IDS_CAPACITE)[number];

export interface Capacite {
  id: IdCapacite;
  nom: string;
  description: string;
}

/** Glossaire des capacités, dans l'ordre des règles. */
export const CAPACITES: Record<IdCapacite, Capacite> = {
  batch: { id: 'batch', nom: 'Batch', description: 'Ne peut pas attaquer deux tours de suite.' },
  veteran: {
    id: 'veteran',
    nom: 'Vétéran',
    description:
      'Ne peut pas être ciblé par les cartes de la famille IA agentique ni par les incidents IA.',
  },
  'non-conforme': {
    id: 'non-conforme',
    nom: 'Non conforme',
    description: 'Au début de votre tour, votre SI perd 1 SLA tant que la carte est en jeu.',
  },
  'sur-site': {
    id: 'sur-site',
    nom: 'Sur site',
    description:
      'Au début de votre tour, payez 1 Débit d’entretien, sinon la carte ne peut pas attaquer ce tour.',
  },
  hub: { id: 'hub', nom: 'Hub', description: 'Vos autres composants ont +1 attaque.' },
  'point-unique': {
    id: 'point-unique',
    nom: 'Point unique',
    description: 'Quand cette carte est détruite, vos autres composants subissent 1 dégât.',
  },
  garde: {
    id: 'garde',
    nom: 'Garde',
    description: 'Doit être attaqué avant vos autres composants et votre SI.',
  },
  quotas: {
    id: 'quotas',
    nom: 'Quotas',
    description: 'Ne peut pas être attaqué plus de 2 fois par tour.',
  },
  connecteur: {
    id: 'connecteur',
    nom: 'Connecteur',
    description: 'Quand la carte est posée, piochez autant de cartes que la valeur indiquée.',
  },
  diffusion: {
    id: 'diffusion',
    nom: 'Diffusion',
    description:
      'Quand elle attaque un composant, inflige aussi 1 dégât à 2 autres composants adverses au plus.',
  },
  reactif: {
    id: 'reactif',
    nom: 'Réactif',
    description:
      'Une fois par tour, quand un de vos composants est attaqué, inflige 1 dégât à l’attaquant.',
  },
  'file-durable': {
    id: 'file-durable',
    nom: 'File durable',
    description:
      'Une fois par partie, quand un de vos composants est détruit, il revient dans votre main.',
  },
  supervision: {
    id: 'supervision',
    nom: 'Supervision',
    description: 'Au début de votre tour, regardez la carte du dessus de la pioche adverse.',
  },
  migration: {
    id: 'migration',
    nom: 'Migration',
    description:
      'Une fois, remplacez cette carte par un composant API ou EDA de votre main, qui coûte alors 2 de moins.',
  },
  autonome: {
    id: 'autonome',
    nom: 'Autonome',
    description:
      'N’attaque pas sur ordre : au début de votre tour, il attaque une cible valide tirée au hasard.',
  },
  orchestration: {
    id: 'orchestration',
    nom: 'Orchestration',
    description: 'Vous choisissez la cible de vos composants Autonomes.',
  },
  outillage: {
    id: 'outillage',
    nom: 'Outillage',
    description:
      'Au début de votre tour, choisissez un de vos composants non IA : vos agents gagnent sa capacité jusqu’à la fin du tour.',
  },
  delegation: {
    id: 'delegation',
    nom: 'Délégation',
    description: 'Une fois par tour, un autre de vos agents peut attaquer une seconde fois.',
  },
  contexte: {
    id: 'contexte',
    nom: 'Contexte',
    description: '+1 attaque par tranche de 2 cartes dans votre défausse (+3 au plus).',
  },
  'garde-fous': {
    id: 'garde-fous',
    nom: 'Garde-fous',
    description: 'Vos composants IA sont immunisés contre Hallucination et Prompt injection.',
  },
  asynchrone: {
    id: 'asynchrone',
    nom: 'Asynchrone',
    description: 'Vos composants IA sont immunisés contre Timeout et Boucle d’agents.',
  },
  'cache-semantique': {
    id: 'cache-semantique',
    nom: 'Cache sémantique',
    description: 'Votre premier sort IA de chaque tour ne coûte rien.',
  },
  'routage-multi-modeles': {
    id: 'routage-multi-modeles',
    nom: 'Routage multi-modèles',
    description:
      'Une fois par tour, renvoyez un de vos composants IA dans votre main et posez gratuitement un composant IA de votre main de coût inférieur ou égal.',
  },
};
