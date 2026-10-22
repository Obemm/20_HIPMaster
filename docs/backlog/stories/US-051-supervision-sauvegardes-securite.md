# US-051 — Supervision, sauvegardes vérifiées et scan de sécurité

- **Epic** : EPIC-09
- **Statut** : À affiner
- **Priorité** : Must
- **Taille** : S
- **Branche** : `us-051-supervision-sauvegardes-securite`

## Récit

En tant que **porteur du projet**, je veux **être prévenu quand le jeu tombe, savoir restaurer la base et avoir
vérifié les failles évidentes** afin d'**inviter mes collègues l'esprit tranquille**.

## Critères d'acceptation

- [ ] **Étant donné** le site en ligne, **alors** un test de disponibilité Cloud Monitoring interroge `/api/v1/sante`
      toutes les 15 minutes, et une indisponibilité qui dure m'envoie un e-mail. Cette route **ne touche pas la base** :
      la réveiller à chaque test l'empêcherait de se mettre en veille et épuiserait le quota Neon gratuit (ADR 0021).
- [ ] **Étant donné** la consommation de la base Neon, **alors** elle est relevée chaque jour (heures de calcul,
      stockage), et un e-mail m'alerte quand elle dépasse 70 % du quota gratuit du mois.
- [ ] **Étant donné** une erreur 500 de l'API, **alors** elle apparaît dans Error Reporting avec sa pile d'appels,
      sans jeton, code de récupération ni corps de requête dans le journal.
- [ ] **Étant donné** une erreur JavaScript non gérée dans le navigateur d'un joueur, **alors** elle est envoyée
      (message, page, version) à une route de l'API limitée en débit, et apparaît dans Error Reporting ; les source
      maps restent hors du site publié.
- [ ] **Étant donné** la base Neon, **alors** un job Cloud Run déclenché chaque nuit par Cloud Scheduler en fait un
      `pg_dump` compressé dans le bucket de sauvegarde (30 jours gardés), et son échec m'envoie un e-mail : c'est aussi
      la vérification quotidienne que la base répond.
- [ ] **Étant donné** une sauvegarde, **quand** je suis la procédure de restauration du guide d'exploitation,
      **alors** elle est restaurée dans une branche Neon temporaire, les comptes et collections y sont retrouvés, puis
      la branche est supprimée. Procédure essayée une fois.
- [ ] **Étant donné** le site en ligne (ou un environnement identique), **quand** un scan OWASP ZAP de base
      s'exécute, **alors** aucune alerte de niveau élevé ne reste sans réponse ; les alertes acceptées sont
      justifiées dans la story.

## Notes

- ADR-043 Elis (DAST) adapté : un scan de base avant l'ouverture, puis à chaque version majeure (ADR 0021).
- L'historique de restauration de Neon Free ne couvre que 6 heures : d'où la sauvegarde de chaque nuit.
- Cloud Scheduler offre 3 tâches gratuites : sauvegarde, purge (US-054) et relevé de consommation.
- Les journaux Cloud Logging sont gardés 30 jours par défaut : durée à reprendre dans la page de confidentialité
  (US-053).

## Journal

- 2026-10-22 — création, issue de la revue avant mise en ligne (ADR 0021).
