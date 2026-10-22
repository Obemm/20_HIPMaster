# US-052 — Parties contre le bot gardées en base

- **Epic** : EPIC-09
- **Statut** : À affiner
- **Priorité** : Must
- **Taille** : M
- **Branche** : `us-052-parties-bot-en-base`

## Récit

En tant que **joueur**, je veux **que ma partie contre le bot survive à une mise à jour du jeu ou à une pause** afin
de **ne pas perdre une partie en cours sans raison**.

## Contexte

L'ADR 0014 garde les parties contre le bot dans la mémoire de l'API (une `Map` par processus) et impose une seule
instance. Sur Cloud Run (ADR 0021) :

- chaque déploiement remplace l'instance : avec le déploiement continu (US-050) et le rythme actuel de plusieurs
  merges par jour, les parties en cours seraient perdues plusieurs fois par jour ;
- l'arrêt à zéro (après une quinzaine de minutes sans requête) et les recyclages d'instance effacent aussi tout ;
- garder une instance allumée en permanence (`min-instances=1`) limiterait les pertes, mais ferait payer une instance
  à toute heure, sans régler les déploiements ;
- l'écran de partie annonce qu'une partie « expire après 30 minutes sans activité » : ce serait faux.

Les duels sont déjà en base (ADR 0020), avec le même moteur et un état sérialisable (ADR 0013) : 11 à 18 Ko par
partie, 1,5 ms de calcul par action du bot en moyenne.

## Critères d'acceptation

- [ ] **Étant donné** une partie contre le bot en cours, **quand** l'API redémarre (nouvelle instance sur la même
      base), **alors** la partie reprend là où elle en était (test d'API).
- [ ] **Étant donné** deux actions envoyées en même temps sur une même partie, **alors** une seule est appliquée,
      l'autre reçoit 409 (version, comme les duels).
- [ ] **Étant donné** une partie sans activité depuis une durée réglable, **alors** elle est considérée comme
      expirée à la lecture et purgée ensuite ; le texte de l'écran de partie dit la vraie règle.
- [ ] **Étant donné** des parties anonymes (sans compte), **alors** elles restent possibles (ADR 0017) et leur nombre
      est borné par la limitation de débit (US-047) et la purge.
- [ ] Le service Cloud Run peut passer à plusieurs instances (ADR 0021) ; l'ADR 0014 est remplacé par un nouvel ADR.

## Notes

- Piste : une table `parties` proche de `duels` (identifiant, joueur facultatif, decks, niveau, état JSON, version,
  dates), et le bot qui joue dans la transaction de l'action du joueur.
- La récompense de victoire reste garantie une seule fois par partie (`recompenses.partie_id`).

## Journal

- 2026-10-22 — création, issue de la revue avant mise en ligne (ADR 0014 et 0021).
