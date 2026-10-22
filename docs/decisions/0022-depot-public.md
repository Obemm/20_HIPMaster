# 0022 — Dépôt GitHub public

- **Date** : 2026-10-22
- **Statut** : Acceptée
- **Complète** : [0009](0009-qualite-sonarway.md) (sa prémisse « dépôt privé » ne tient plus)
- **Référence Elis** : ADR-011 (Azure Repo) — déjà écarté par l'ADR 0005 ; ADR-039 (SonarCloud, quality gate
  bloquant) — adapté par l'ADR 0009, qui redevient applicable sans coût ; ADR-033 (assistants de code IA) — retenu :
  aucun secret dans le dépôt ni dans les prompts

## Contexte

La revue avant mise en ligne du 2026-10-22 a constaté que le dépôt `Obemm/20_HIPMaster` est **public**, alors que
l'ADR 0009 raisonne « tant que le dépôt est privé ». Le dépôt contient le texte des cartes (produits et plateforme
d'intégration d'Elis, avec leurs versions) et un résumé du référentiel d'ADR d'Elis (ADR 0005).

## Décision

- Le dépôt **reste public**. Le porteur du projet juge que ces informations ne sont pas confidentielles : on les
  retrouve en quelques minutes sur des profils publics (2026-10-22). Les textes des cartes ne changent pas.
- Ce qui ne doit jamais entrer dans le dépôt : secrets (mots de passe, jetons, clés), données de joueurs, fichiers
  `.env`. Les secrets de production vivent dans Secret Manager et dans les variables GitHub (ADR 0021).

## Alternatives envisagées

- **Dépôt privé** : rien n'est visible, mais les minutes GitHub Actions deviennent limitées (2 000 par mois), quand
  la CI en a consommé environ 80 par jour pendant la semaine du 2026-10-16, et SonarQube Cloud devient payant.
- **Dépôt public nettoyé** de toute mention d'Elis : sans objet, puisque ces informations sont publiques.

## Conséquences

- GitHub Actions reste gratuit et sans plafond de minutes pour ce dépôt.
- **SonarQube Cloud est gratuit pour un dépôt public** : l'écart avec ADR-039 que l'ADR 0009 assumait (pas de tableau
  de bord ni de suivi de la dette) peut être levé, par une story dédiée si le porteur du projet le souhaite.
- Le code est lisible par tous : la sécurité ne repose jamais sur le secret d'un algorithme. C'est pourquoi le hasard
  des duels doit devenir imprévisible même pour qui lit le code (US-058).
- La protection contre la publication de secrets de GitHub (secret scanning, push protection) est à garder active.
