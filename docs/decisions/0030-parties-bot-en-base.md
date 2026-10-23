# 0030 — Parties contre le bot gardées en base, version et écriture unique par action

- **Date** : 2026-10-23
- **Statut** : Acceptée
- **Référence Elis** : ADR-020 (API REST : réponse en moins de 3 s pour une API front, design first) — retenu ; aucun
  ADR Elis ne traite de l'état applicatif

## Contexte

L'ADR 0014 gardait les parties contre le bot dans la mémoire de l'API, à une seule instance. Sur Cloud Run (ADR
0021), chaque déploiement (plusieurs par jour depuis le déploiement continu, ADR 0028), chaque arrêt à zéro et chaque
recyclage d'instance efface les parties en cours ; l'écran annonçait pourtant « 30 minutes sans activité ». L'ADR 0014
prévoyait d'y revenir à l'arrivée des comptes et avant toute mise à l'échelle. Les duels vivent déjà en base (ADR 0020) avec le même moteur et le même état sérialisable (ADR 0013) : 11 à 18 Ko par partie, 1,5 ms de calcul par
action du bot. PostgreSQL est là en production (Neon, ADR 0023) et PGlite en développement (ADR 0018). Les parties
sans compte doivent rester possibles (ADR 0017), et l'ADR 0025 a fixé à qui appartient une partie et ce qu'on évince
au plafond.

## Décision

- **Une table `parties`** : identifiant UUID v4, propriétaire facultatif (joueur et empreinte du jeton de la session
  qui l'a créée, tous deux absents pour une partie anonyme), deck du joueur, deck du bot, niveau, **état complet du
  moteur en JSON**, **numéro de version**, dates de création et de dernier coup. Les deux colonnes du propriétaire
  sont des clés étrangères en cascade : supprimer le compte ou fermer la session supprime ses parties, qu'aucune autre
  session ne peut lire.
- **Une action, une seule écriture, conditionnée à la version lue** (concurrence optimiste, comme les duels) : l'API lit
  la partie, applique l'action du joueur puis fait jouer **tout le tour du bot** en mémoire, et écrit le résultat d'un
  seul `UPDATE … WHERE version = $lue`. Si une autre action est passée entre-temps, l'écriture ne trouve plus sa
  version : **409**, rien n'est appliqué. Aucun verrou n'est tenu pendant le calcul du bot. Un en-tête `If-Match`
  facultatif (la version de la réponse précédente, aussi donnée en `ETag`) refuse d'emblée une action fondée sur une
  version dépassée, par exemple un double clic sur « Finir le tour ».
- **Expiration à la lecture : 24 heures sans coup joué** (la création ou une action ; une simple lecture ne prolonge
  pas la partie), valeur réglable. Une partie expirée répond 404 comme une partie inconnue. **Purge à la création** :
  chaque nouvelle partie supprime d'abord toutes les parties expirées. Aucune tâche de fond, comme pour les boosters
  (ADR 0019) et les duels (ADR 0020).
- **Plafond : 1 000 parties**, réglable. Au-delà, la création supprime la partie anonyme la moins récemment jouée, et
  seulement à défaut celle d'un joueur connecté : la règle d'ADR 0025 est reprise telle quelle. Avec la limitation de
  débit (20 créations par minute et par adresse, ADR 0025), le volume reste borné : 1 000 parties de 18 Ko au plus
  font moins de 20 Mo, loin du 1 Go de Neon Free (ADR 0021).
- Inchangé depuis l'ADR 0014 : l'API ne renvoie **jamais l'état complet**, seulement la vue du joueur ; le joueur est
  toujours `j1`, le bot `j2` ; le bot joue **dans la requête** du joueur, très loin de la limite de 3 s d'ADR-020.
  Une partie lancée par un compte n'est visible que de sa session (ADR 0025), une partie anonyme de qui connaît son
  identifiant.

## Alternatives envisagées

- **Garder la mémoire, avec `min-instances=1`** : moins de pertes à l'arrêt à zéro, mais une instance payée à toute
  heure, et toujours une perte à chaque déploiement. Écartée.
- **Verrou de ligne (`SELECT … FOR UPDATE`) pendant l'action, comme les duels** : deux actions simultanées
  s'appliqueraient l'une après l'autre, et deux « Finir le tour » passeraient deux tours (le bot rend la main entre
  les deux). L'écriture conditionnée à la version refuse la seconde, sans garder de verrou pendant le tour du bot.
- **Une table par événement (journal en lignes)** plutôt qu'un état JSON : le moteur produit un état complet et
  sérialisable (ADR 0013) ; le découper n'apporterait rien à des parties de quelques minutes.
- **Redis ou Memorystore** : partagé et rapide, mais un service payant de plus (ADR 0021), pour un besoin que la base
  déjà là couvre.
- **État chez le client (jeton signé)** : la main et la pioche du bot devraient transiter chiffrées, et l'état
  grossirait à chaque action (déjà écarté par l'ADR 0014).
- **Réserver les parties aux joueurs connectés** : plus simple à borner, mais contraire à l'ADR 0017 (on joue sans
  compte). Écartée.

## Conséquences

- Une partie survit aux déploiements, aux arrêts à zéro et aux redémarrages ; l'écran dit la vraie règle (24 heures
  sans coup joué). Au déploiement de ce changement, les parties gardées en mémoire par l'ancienne révision sont perdues
  une dernière fois.
- La migration ne fait qu'ajouter une table : la version en ligne n'en dépend pas.
- Chaque action coûte une lecture et une écriture de 11 à 18 Ko, et une partie, même anonyme, réveille la base Neon :
  à surveiller avec le reste de la consommation (US-051).
- Plus rien dans les parties n'impose une seule instance : la contrainte posée par l'ADR 0014 à l'ADR 0021 est levée.
  Passer à plusieurs instances reste une décision d'exploitation : les compteurs de la limitation de débit sont propres
  à chaque instance (ADR 0025, ils seraient multipliés d'autant) et chaque instance ouvre son propre pool de connexions
  (ADR 0023).
- Le front peut envoyer `If-Match` pour éviter qu'un double clic joue deux fois ; sans lui, rien ne change pour
  l'ancien front.
- L'ADR [0014](0014-parties-en-memoire.md) est remplacé par celui-ci.
