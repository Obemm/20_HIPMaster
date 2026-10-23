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
  2: {
    definition:
      'SSH File Transfer Protocol : le transfert de fichiers à travers une connexion SSH chiffrée. Malgré son nom, ce n’est pas du FTP sécurisé (ça, c’est FTPS) mais un autre protocole.',
    usage:
      'Échanger des fichiers avec un partenaire ou entre serveurs sans exposer ni mot de passe ni contenu : la connexion est chiffrée, et l’on s’authentifie par mot de passe ou, mieux, par clé SSH.',
    exemple:
      'Chaque matin, une banque met un relevé à disposition sur son serveur SFTP ; le traitement de la trésorerie s’y connecte avec sa clé et le télécharge.',
    aRetenir:
      'Le chiffrement protège le transport, pas le reste : un fichier peut toujours arriver incomplet, en double ou en retard. Et les clés se gèrent : une par partenaire, renouvelées, révoquées au départ du partenaire.',
    chezElis:
      'Proscrit chez Elis, comme FTP, et pourtant encore utilisé par beaucoup de projets : chaque nouvel échange passe par une API ou un événement, et les flux existants sont appelés à y migrer.',
    liens: [
      {
        titre: 'SSH File Transfer Protocol',
        url: 'https://fr.wikipedia.org/wiki/SSH_File_Transfer_Protocol',
        langue: 'fr',
      },
      { titre: 'sftp(1), manuel OpenBSD', url: 'https://man.openbsd.org/sftp', langue: 'en' },
    ],
  },
  3: {
    definition:
      'L’échange de données informatisé : des documents commerciaux (commandes, factures, avis d’expédition) envoyés d’ordinateur à ordinateur dans un format normalisé, comme EDIFACT ou X12.',
    usage:
      'Automatiser les échanges avec les clients, fournisseurs et transporteurs : chaque partenaire comprend le même message, sans ressaisie ni papier. Une pratique née dans les années 1970, toujours au cœur du commerce B2B.',
    exemple:
      'Un client envoie une commande EDIFACT ORDERS ; elle est traduite, la commande est créée, puis un message ORDRSP part pour la confirmer et un DESADV annonce l’expédition.',
    aRetenir:
      'Une norme n’empêche pas les variantes : chaque partenaire a son guide d’implémentation. Documenter ses messages et tester avec chaque nouveau partenaire avant la production.',
    liens: [
      {
        titre: 'Échange de données informatisé',
        url: 'https://fr.wikipedia.org/wiki/%C3%89change_de_donn%C3%A9es_informatis%C3%A9',
        langue: 'fr',
      },
      { titre: 'EDIFACT', url: 'https://en.wikipedia.org/wiki/EDIFACT', langue: 'en' },
    ],
  },
  4: {
    definition:
      'Comma-Separated Values : un fichier texte où chaque ligne est un enregistrement et chaque champ est séparé par une virgule… ou un point-virgule, ou une tabulation.',
    usage:
      'Le format d’échange le plus simple : exports de tableur, chargements en masse, extractions de base, fichiers de partenaires. Lisible par un humain comme par une machine.',
    exemple:
      'Un tableur réglé en français exporte avec des points-virgules, car la virgule sert aux décimales (1,5) ; le programme qui attendait des virgules coupe les lignes au milieu des montants.',
    aRetenir:
      'Le CSV n’a qu’une norme légère (RFC 4180) : fixer le séparateur, l’encodage (UTF-8), la ligne d’en-tête et l’échappement des guillemets, et les écrire dans le contrat d’échange.',
    liens: [
      {
        titre: 'Comma-separated values',
        url: 'https://fr.wikipedia.org/wiki/Comma-separated_values',
        langue: 'fr',
      },
      {
        titre: 'RFC 4180 : le format CSV',
        url: 'https://www.rfc-editor.org/rfc/rfc4180.html',
        langue: 'en',
      },
    ],
  },
  5: {
    definition:
      'Un fichier texte où chaque champ occupe toujours les mêmes colonnes : pas de séparateur, des lignes de longueur fixe, des valeurs complétées par des espaces ou des zéros.',
    usage:
      'Le format des systèmes historiques (mainframe, COBOL, banque, paie) : simple à lire pour une machine qui connaît la description des colonnes, le « dessin d’enregistrement ».',
    exemple:
      'Le montant est en colonnes 47 à 52, sur 6 chiffres sans virgule : « 001250 » veut dire 12,50 €. Un caractère de décalage, et toute la ligne est fausse.',
    aRetenir:
      'Sans description à jour, le fichier est illisible : versionner le dessin d’enregistrement, contrôler la longueur de chaque ligne et refuser le fichier au premier décalage.',
    liens: [
      {
        titre: 'Flat-file database (fichiers à largeur fixe)',
        url: 'https://en.wikipedia.org/wiki/Flat-file_database',
        langue: 'en',
      },
      { titre: 'Cobol', url: 'https://fr.wikipedia.org/wiki/COBOL', langue: 'fr' },
    ],
  },
  6: {
    definition:
      'Le planificateur des systèmes Unix : il lance des commandes à heure fixe, décrites dans une table (crontab) en cinq champs : minute, heure, jour du mois, mois, jour de la semaine.',
    usage:
      'Déclencher les traitements récurrents : imports de nuit, purges, sauvegardes, envois de rapports. « 0 2 * * * » veut dire « tous les jours à 2 h 00 ».',
    exemple:
      'À 2 h, cron lance l’import des commandes ; à 3 h, celui de la facturation, en supposant que le premier a fini… ce que cron ne vérifie pas.',
    aRetenir:
      'Cron lance, il ne surveille pas : sans alerte en cas d’échec, sans verrou contre deux exécutions qui se chevauchent, et sans attention au passage à l’heure d’été, les traitements échouent en silence.',
    liens: [
      { titre: 'cron', url: 'https://fr.wikipedia.org/wiki/Cron', langue: 'fr' },
      {
        titre: 'crontab(5), manuel Linux',
        url: 'https://man7.org/linux/man-pages/man5/crontab.5.html',
        langue: 'en',
      },
    ],
  },
  7: {
    definition:
      'Un dossier partagé où un système dépose des fichiers et où un autre vient les chercher : le point de rendez-vous de l’intégration par fichiers.',
    usage:
      'Découpler l’émetteur et le récepteur dans le temps : l’un dépose quand il veut, l’autre scrute le dossier à intervalle régulier, traite ce qu’il trouve, puis l’archive.',
    exemple:
      'Le logiciel de paie dépose virements.xml dans /depot/entrant ; toutes les 5 minutes, l’intégration le prend, le traite et le déplace dans /depot/archive.',
    aRetenir:
      'Un dossier par étape (entrant, en cours, traité, en erreur), jamais de lecture d’un fichier encore en cours d’écriture, et une purge des archives : sinon le dépôt devient un grenier.',
    liens: [
      {
        titre: 'File Transfer (Enterprise Integration Patterns)',
        url: 'https://www.enterpriseintegrationpatterns.com/patterns/messaging/FileTransferIntegration.html',
        langue: 'en',
      },
    ],
  },
  8: {
    definition:
      'Un petit fichier, souvent vide, déposé juste après le fichier de données pour signaler qu’il est complet et qu’on peut le traiter.',
    usage:
      'Éviter de lire un fichier encore en cours de copie : le récepteur attend commandes.ok avant de prendre commandes.csv. Le témoin peut aussi porter le nombre de lignes ou une somme de contrôle.',
    exemple:
      'Le transfert de 2 Go se termine à 2 h 07, le témoin arrive à 2 h 08. Le traitement de 2 h 05 n’a rien pris ; celui de 2 h 10 traite le fichier entier.',
    aRetenir:
      'Le témoin ne vaut que s’il est déposé après le fichier. Autre parade : écrire sous un nom temporaire puis renommer, une opération atomique. Et vérifier la somme de contrôle.',
    liens: [
      {
        titre: 'File Transfer (Enterprise Integration Patterns)',
        url: 'https://www.enterpriseintegrationpatterns.com/patterns/messaging/FileTransferIntegration.html',
        langue: 'en',
      },
      {
        titre: 'Somme de contrôle',
        url: 'https://fr.wikipedia.org/wiki/Somme_de_contr%C3%B4le',
        langue: 'fr',
      },
    ],
  },
};
