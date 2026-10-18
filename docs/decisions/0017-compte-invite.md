# 0017 — Compte invité : pseudo, jeton secret et code de récupération

- **Date** : 2026-10-18
- **Statut** : Acceptée
- **Référence Elis** : ADR-010 et ADR-034 (Okta pour toute application) — écartés, comme le prévoit l'ADR 0005 : pas de
  tenant Okta hors du SI Elis ; on en garde l'esprit, **aucun mot de passe maison**

## Contexte

US-022 donne aux joueurs un compte pour garder leur collection (EPIC-02, EPIC-03). Le porteur du projet veut faire
**simple pour le moment** (2026-10-18). L'ADR 0005 écarte Okta et demande d'éviter les mots de passe maison ; l'EPIC-02
vise une inscription en moins de 30 secondes, sans mot de passe à retenir.

## Décision

- **Compte invité** : le joueur choisit un **pseudo** (2 à 24 caractères) ; aucun e-mail, aucun mot de passe.
- À la création, le serveur renvoie :
  - un **jeton de session** aléatoire (32 octets, base64url), gardé par le navigateur et envoyé dans l'en-tête
    `Authorization: Bearer …` ;
  - un **code de récupération** lisible (`ABCD-EFGH-JKLM`, 12 caractères d'un alphabet sans caractères ambigus, soit
    60 bits), affiché **une seule fois**, pour retrouver son compte sur un autre appareil.
- La base ne garde que l'**empreinte SHA-256** du jeton et du code (valeurs aléatoires à forte entropie : un hachage
  lent n'apporte rien). Un code perdu se régénère depuis un appareil connecté ; l'ancien cesse alors de fonctionner.
- Se connecter avec son code ouvre une **nouvelle session** (un jeton par appareil) ; se déconnecter supprime la
  session de l'appareil.
- Les routes qui exigent un compte répondent **401** au format Problem Details sans jeton valide. Les parties contre le
  bot restent jouables sans compte.

## Alternatives envisagées

- **Fournisseur OIDC** (Google, Microsoft, Entra ID) : la cible à terme, sans mot de passe à gérer, mais il faut
  enregistrer une application et gérer les redirections : pas « simple pour le moment ». Le compte invité pourra être
  rattaché plus tard à une identité OIDC.
- **Lien magique par e-mail** : demande un service d'envoi et la collecte d'adresses (données personnelles).
- **Cookie de session `HttpOnly`** au lieu du jeton dans le stockage du navigateur : mieux protégé contre une faille
  XSS, mais demande une protection CSRF ; pour un jeu interne sans donnée sensible, et avec l'échappement d'Angular, le
  jeton `Bearer` reste plus simple. À reconsidérer avec OIDC.

## Conséquences

- Perdre son code **et** tous ses appareils connectés fait perdre le compte : c'est dit au joueur quand le code
  s'affiche.
- Aucune donnée personnelle collectée au-delà d'un pseudo libre.
- Pas de limitation de débit sur la saisie du code pour l'instant : 60 bits rendent la devinette hors de portée ;
  à ajouter avant toute ouverture publique.
