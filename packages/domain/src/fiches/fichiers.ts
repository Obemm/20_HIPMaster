import type { Fiche } from './fiche.ts';

/** Fiches « En savoir plus » de la famille Fichiers & Batch, par numéro de carte (ADR 0036). */
export const FICHES_FICHIERS: Readonly<Record<number, Fiche>> = {
  1: {
    definition:
      'File Transfer Protocol : le protocole historique, normalisé dès les années 1970 (RFC 959 en 1985), pour copier des fichiers d’une machine à une autre.',
    usage:
      'Déposer ou récupérer des fichiers sur un serveur : exports de nuit, échanges avec un partenaire, chargements en masse. Simple et présent partout, il a longtemps été la façon la plus rapide de faire parler deux systèmes.',
    exemple:
      'Un partenaire dépose chaque soir commandes.csv sur le serveur FTP ; à 2 h, un traitement batch le récupère et l’intègre dans l’ERP.',
    aRetenir:
      'FTP ne chiffre rien : identifiant, mot de passe et contenu circulent en clair sur le réseau. Et un fichier déposé ne dit ni s’il est complet, ni s’il a déjà été traité.',
    chezElis:
      'Interdit chez Elis : les échanges qui en dépendent encore sont appelés à passer par une API ou un événement.',
    liens: [
      {
        titre: 'File Transfer Protocol',
        url: 'https://fr.wikipedia.org/wiki/File_Transfer_Protocol',
        langue: 'fr',
      },
      {
        titre: 'RFC 959 : File Transfer Protocol',
        url: 'https://www.rfc-editor.org/rfc/rfc959.html',
        langue: 'en',
      },
    ],
  },
};
