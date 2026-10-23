import type { Fiche } from './fiche.ts';

/** Fiches « En savoir plus » de la famille iPaaS, par numéro de carte (ADR 0034). */
export const FICHES_IPAAS: Readonly<Record<number, Fiche>> = {
  26: {
    definition:
      'L’offre iPaaS (Integration Platform as a Service) de webMethods : l’intégration hébergée dans le cloud par l’éditeur, sans serveur à installer ni à mettre à jour.',
    usage:
      'Assembler des intégrations à partir de connecteurs prêts à l’emploi (applications SaaS, ERP, bases) et de flux dessinés, orchestrer plusieurs applications et exposer le résultat en API.',
    exemple:
      'Quand un client est créé dans le CRM, un flux webMethods.io le crée dans l’ERP, puis prévient le service facturation.',
    aRetenir:
      'Moins de serveurs ne veut pas dire moins de rigueur : versionner les flux, les tester, superviser les exécutions et surveiller la consommation restent indispensables.',
    chezElis:
      'La cible de l’ESB historique d’Elis : migrer vers l’iPaaS supprime l’entretien des serveurs sur site.',
    liens: [
      {
        titre: 'Cloud-based integration (iPaaS)',
        url: 'https://en.wikipedia.org/wiki/Cloud-based_integration',
        langue: 'en',
      },
      {
        titre: 'IBM webMethods Integration',
        url: 'https://www.ibm.com/products/webmethods-integration',
        langue: 'en',
      },
    ],
  },
};
