# 0029 — Administrateurs désignés par la configuration de l'API, routes d'administration cachées derrière un 404

- **Date** : 2026-10-23
- **Statut** : Acceptée
- **Complète** : [0017](0017-compte-invite.md) (compte invité) et [0027](0027-inscription-sur-invitation.md)
  (inscription sur invitation, qui écartait une page d'administration) ; s'appuie sur [0025](0025-protections-api.md)
  (limitation de débit, sessions révocables)
- **Référence Elis** : ADR-010 et ADR-034 (Okta) — toujours écartés (ADR 0017) : le rôle d'administrateur s'attache
  au compte invité, sans fournisseur d'identité. ADR-020 (règles de conception et de sécurité des API REST) — retenu :
  contrat écrit avant le code, autorisation vérifiée côté serveur à chaque requête.

## Contexte

Les invitations (ADR 0027) ne se créent qu'en ligne de commande, avec les secrets de production : le porteur du projet
ne peut pas inviter un collègue depuis son téléphone. L'ADR 0027 écartait une page d'administration « tant que la ligne
de commande suffit » ; elle ne suffit plus. Décision du porteur du projet (2026-10-23) : une page « Inviter » réservée
à **son seul compte**, sans invitations par les joueurs.

Contraintes : les comptes n'ont ni e-mail ni mot de passe (ADR 0017), seulement un jeton de session et un code de
récupération ; le dépôt est public (ADR 0022) ; le front ne fait jamais foi (ADR 0004) ; le développement et les e2e
doivent pouvoir essayer la page sans base de production.

## Décision

- **Qui est administrateur : la variable `ADMINISTRATEURS` de l'API**, une liste d'identifiants de joueur (UUID)
  séparés par des virgules ou des espaces. Absente ou vide : personne. Une valeur qui n'est pas un UUID empêche l'API
  de démarrer (`ErreurConfig`). Hors production seulement, la valeur `tous` fait de chaque compte un administrateur,
  pour les parcours e2e et l'essai en développement ; en production, l'API refuse de démarrer avec elle.
- **Le contrôle se fait sur le serveur, à chaque requête** : le jeton de la session désigne un joueur, dont
  l'identifiant doit figurer dans la liste. Le front ne décide de rien : il ne fait que montrer ou cacher le lien.
- **Toute route d'administration (`/api/v1/admin/…`) répond 404 à tout autre appelant** (sans jeton, jeton inconnu ou
  expiré, joueur ordinaire), avec la réponse exacte d'une route qui n'existe pas. Le contrôle passe en premier (crochet
  `onRequest`), avant la lecture du corps et avant la limite de débit : un non-administrateur n'obtient jamais ni 400,
  ni 401, ni 403, ni 429. La sécurité ne repose pas sur ce secret (le dépôt est public) ; le 404 évite seulement de
  désigner une cible à qui sonde le site.
- **Le front l'apprend de `GET /moi`** (et de la création de compte ou de la connexion) : `administrateur: true` pour
  un administrateur, champ **absent** sinon. La réponse d'un joueur ordinaire ne change pas.
- **Routes** (contrat `apps/api/openapi/administration.yaml`) : `GET /admin/invitations` (la liste, jamais le code),
  `POST /admin/invitations` (libellé, nombre de comptes, date limite : le code et le lien, renvoyés cette seule fois),
  `POST /admin/invitations/{id}/revocation`. Elles appellent les fonctions de `apps/api/src/comptes/invitations.ts`,
  les mêmes que la commande `npm run invitation`, qui reste disponible.
- **Révocation visible** : une colonne `revoquee_le` (facultative) distingue une invitation révoquée d'une invitation
  expirée ; révoquer pose aussi l'expiration à l'instant même, si bien que la consommation des codes ne change pas.
- **Le lien** est construit par l'API avec l'adresse du site, `ADRESSE_SITE` : `https://hipmaster.web.app` par défaut
  en production, `http://localhost:4200` ailleurs.
- **Limite de débit** `administration` : 60 requêtes par minute et par adresse sur chaque route, appliquée une fois
  l'administrateur reconnu.
- **Journal** : chaque création et chaque révocation est journalisée avec l'identifiant de l'administrateur et celui de
  l'invitation, jamais le code.
- **Déploiement** : la liste vient de la variable GitHub `HIPMASTER_ADMINISTRATEURS` (une variable, pas un secret :
  un identifiant seul n'ouvre aucune session), transmise par le workflow à `scripts/gcp/deployer.sh`, qui la pose sur
  le service Cloud Run. Depuis un poste, la même variable d'environnement. Elle n'est pas écrite dans le dépôt.

## Alternatives envisagées

- **Une colonne « rôle » en base** : il faudrait un moyen de la poser (requête SQL en production, ou une commande de
  plus) ; un rôle changé en base ne laisse aucune trace dans la configuration déployée. Écartée pour un seul
  administrateur.
- **Un mot de passe d'administration** (secret partagé saisi dans la page) : un second secret à garder, à faire
  tourner, exposé à la saisie sur un téléphone, et contraire à l'esprit de l'ADR 0017. Écarté.
- **Un compte Google, Okta, ou Identity-Aware Proxy devant les routes d'administration** : un fournisseur d'identité
  et, pour IAP, un équilibreur de charge payant (ADR 0021, 0027). Écarté.
- **Répondre 403 aux non-administrateurs** : plus explicite, mais il confirme l'existence de la route. Écarté au profit
  du 404, sans coût pour l'administrateur.
- **Laisser la commande comme seul moyen** : c'est la situation qui a motivé la demande. Gardée en secours.

## Conséquences

- Changer d'administrateur demande de modifier `HIPMASTER_ADMINISTRATEURS` puis de redéployer (relancer le dernier
  déploiement suffit) ; un administrateur qui perd son compte en crée un autre, et le guide d'exploitation dit
  comment remplacer son identifiant.
- Une session d'administrateur volée permet de créer des invitations : les sessions se ferment à distance (« Déconnecter
  mes autres appareils », nouveau code de récupération, ADR 0025), les invitations se révoquent, et le journal dit qui a
  fait quoi.
- Le front gagne une page qu'aucun joueur ordinaire ne voit ; ses tests tournent avec `ADMINISTRATEURS=tous`.
- Une migration ajoute la colonne `revoquee_le`, compatible avec la version encore en ligne (ADR 0023).
