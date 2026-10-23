# 0027 — Inscription sur invitation : codes à usages comptés, gardés sous HMAC, créés en ligne de commande

- **Date** : 2026-10-23
- **Statut** : Acceptée
- **Complète** : [0017](0017-compte-invite.md) (compte invité) ; s'appuie sur [0025](0025-protections-api.md) (clé
  des codes, limitation de débit)
- **Référence Elis** : ADR-010 et ADR-034 (Okta) — toujours écartés (ADR 0017) : l'invitation tient lieu de contrôle
  d'accès, sans fournisseur d'identité. ADR-020 (règles de conception des API REST) — retenu : contrat écrit avant le
  code. Page « Secrets must be stored in a key vault » (non opposable, à l'état TODO) — retenue comme inspiration : la
  clé des empreintes vit dans Secret Manager.

## Contexte

Le porteur du projet a choisi, le 2026-10-22, d'ouvrir le jeu à ses collègues **sur invitation** : le site est
joignable sur Internet, mais créer un compte demande un code. Le catalogue et les parties contre le bot restent
ouverts à tous (ADR 0017). Aujourd'hui, `POST /api/v1/joueurs` crée un compte pour qui le demande.

Contraintes : aucune donnée personnelle au-delà d'un pseudo (ADR 0017), donc ni e-mail ni annuaire ; aucune interface
d'administration ; une invitation qui fuit doit pouvoir se révoquer sans toucher aux comptes déjà créés ; le
développement et les parcours e2e créent des comptes à volonté.

## Décision

- **Une table `invitations`** : l'empreinte du code, un libellé (pour qui, pour quelle campagne), le nombre
  d'utilisations maximum et consommées, l'expiration, la date de création. Chaque compte garde la référence de son
  invitation (`invitation_id`, vide pour un compte créé sans invitation) ; supprimer une invitation ne supprime aucun
  compte.
- **Le code** : 16 caractères de l'alphabet des codes de récupération (80 bits), en quatre groupes
  (`ABCD-EFGH-JKLM-NPQR`), pour ne pas le confondre avec un code de récupération, qui en a trois. Il se transmet par
  lien : `/compte?invitation=…` préremplit le champ de la page « Mon compte ».
- **Son empreinte** : HMAC-SHA-256 avec la clé des codes (ADR 0025), préfixé de l'usage `invitation:` : un code
  d'invitation ne vaut jamais comme code de récupération, et inversement. La base ne garde jamais le code.
- **`POST /joueurs` accepte un champ `invitation`**. Il est exigé quand `INSCRIPTION_SUR_INVITATION` vaut `oui` : par
  défaut en production, et seulement là. Un code fourni est toujours vérifié, même quand il n'est pas exigé.
- **Consommation sans dépassement** : une seule requête incrémente le compteur, à condition qu'il reste une
  utilisation et que l'invitation n'ait pas expiré, dans la transaction qui crée le compte. Deux inscriptions
  simultanées ne dépassent jamais le maximum, et une création qui échoue ne consomme rien.
- **Refus : 403** au format Problem Details, avec un seul message pour un code absent, inconnu, expiré ou épuisé : il
  ne dit pas lequel. Les essais sont bornés par la limite d'inscription (30 par heure et par adresse, ADR 0025).
- **La commande `npm run invitation`** (`node apps/api/src/invitation.ts`) crée une invitation (libellé, nombre
  d'utilisations, expiration) et affiche son code **une seule fois** ; elle sait aussi lister les invitations (avec le
  nombre de comptes créés) et en révoquer une (elle expire aussitôt). Comme les migrations (ADR 0023), elle n'écrit que
  dans PostgreSQL (`DATABASE_URL`) : ouvrir le dossier PGlite d'une API en marche l'abîmerait.
- **En production**, la commande tourne dans un **Cloud Run Job**, avec l'image de l'API, le compte `hipmaster-api`
  et les secrets `database-url` et `cle-codes-recuperation` (guide d'exploitation). Le code apparaît alors une fois
  dans le journal de l'exécution, que seul le porteur du projet peut lire. Pour qu'il n'apparaisse nulle part, la
  commande peut aussi tourner sur le poste, avec les secrets lus par `gcloud`.

## Alternatives envisagées

- **Liste d'adresses e-mail autorisées, ou domaine de l'entreprise** : il faudrait collecter des adresses (contraire à
  l'ADR 0017) et vérifier qu'elles appartiennent au joueur, donc envoyer des e-mails. Écartée.
- **Un code unique dans une variable d'environnement** : ni suivi par campagne, ni compteur, ni révocation ; une fuite
  oblige à redéployer. Écartée.
- **Une page d'administration dans le front** : un rôle d'administrateur, des écrans et leurs tests, pour quelques
  invitations par mois. Écartée tant que la ligne de commande suffit.
- **Des invitations signées sans table** (HMAC du libellé et de l'expiration) : ni compteur d'utilisations, ni
  révocation sans changer la clé. Écartées.
- **Fermer tout le site** (authentification devant Firebase Hosting, Identity-Aware Proxy) : demande des comptes
  Google ou un équilibreur de charge payant, et fermerait aussi le catalogue et le bot. Écartée.

## Conséquences

- Changer la clé des codes (en cas de fuite) invalide aussi les invitations en cours : il faut alors en créer de
  nouvelles.
- Une invitation qui fuit se révoque d'une commande ; `invitation_id` dit quels comptes en viennent.
- Le développement et les e2e gardent une inscription libre ; un code fourni y est tout de même vérifié, ce qui permet
  d'essayer le parcours d'invitation.
- Le porteur du projet crée les invitations en ligne de commande, et les transmet par lien.
