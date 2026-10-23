# US-051 — Supervision, sauvegardes vérifiées et scan de sécurité

- **Epic** : EPIC-09
- **Statut** : Faite
- **Priorité** : Must
- **Taille** : S
- **Branche** : `us-051-supervision-sauvegardes-securite`

## Récit

En tant que **porteur du projet**, je veux **être prévenu quand le jeu tombe, savoir restaurer la base et avoir
vérifié les failles évidentes** afin d'**inviter mes collègues l'esprit tranquille**.

## Critères d'acceptation

- [x] **Étant donné** le site en ligne, **alors** un test de disponibilité Cloud Monitoring interroge `/api/v1/sante`
      toutes les 15 minutes, et une indisponibilité qui dure m'envoie un e-mail. Cette route **ne touche pas la base** :
      la réveiller à chaque test l'empêcherait de se mettre en veille et épuiserait le quota Neon gratuit (ADR 0021).
- [x] **Étant donné** la consommation de la base Neon, **alors** elle est relevée chaque jour (heures de calcul,
      stockage), et un e-mail m'alerte quand elle dépasse 70 % du quota gratuit du mois.
- [x] **Étant donné** une erreur 500 de l'API, **alors** elle apparaît dans Error Reporting avec sa pile d'appels,
      sans jeton, code de récupération ni corps de requête dans le journal.
- [x] **Étant donné** une erreur JavaScript non gérée dans le navigateur d'un joueur, **alors** elle est envoyée
      (message, page, version) à une route de l'API limitée en débit, et apparaît dans Error Reporting ; les source
      maps restent hors du site publié.
- [x] **Étant donné** la base Neon, **alors** un job Cloud Run déclenché chaque nuit par Cloud Scheduler en fait un
      `pg_dump` compressé dans le bucket de sauvegarde (30 jours gardés), et son échec m'envoie un e-mail : c'est aussi
      la vérification quotidienne que la base répond.
- [x] **Étant donné** une sauvegarde, **quand** je suis la procédure de restauration du guide d'exploitation,
      **alors** elle est restaurée dans une branche Neon temporaire, les comptes et collections y sont retrouvés, puis
      la branche est supprimée. Procédure essayée une fois.
- [x] **Étant donné** le site en ligne (ou un environnement identique), **quand** un scan OWASP ZAP de base
      s'exécute, **alors** aucune alerte de niveau élevé ne reste sans réponse ; les alertes acceptées sont
      justifiées dans la story.

## Notes

- ADR-043 Elis (DAST) adapté : un scan de base avant l'ouverture, puis à chaque version majeure (ADR 0021).
- L'historique de restauration de Neon Free ne couvre que 6 heures : d'où la sauvegarde de chaque nuit.
- Cloud Scheduler offre 3 tâches gratuites : sauvegarde, purge (US-054) et relevé de consommation.
- Les journaux Cloud Logging sont gardés 30 jours par défaut : durée à reprendre dans la page de confidentialité
  (US-053).
- Décision : [ADR 0033](../../decisions/0033-supervision-sauvegardes.md) (complète les ADR 0021, 0024 et 0028).
- **Disponibilité** : test Cloud Monitoring « HIPMaster : santé de l'API » sur `https://hipmaster.web.app/api/v1/sante`
  (la route ne touche pas la base), toutes les 15 minutes depuis l'Europe, l'Amérique du Sud et l'Asie ; alerte
  « HIPMaster : site indisponible » quand 2 régions sur 3 échouent deux tours de suite (≈ 20 minutes). Les alertes sur
  les tests de disponibilité restent gratuites après septembre 2027.
- **Jobs d'exploitation** : image `exploitation` (Node 24.22 et client PostgreSQL 18.6, `scripts/exploitation/`),
  étiquetée par l'empreinte Git de ses sources, construite et déployée par la dernière étape du déploiement
  (`deployer.sh exploitation`). Un compte de service par job ; chaque compte ne lance que son job.
- **Sauvegarde** : `pg_dump --format=custom --compress=9`, trois essais pour laisser la base sortir de veille, archive
  vérifiée (signature `PGDMP`, données des tables `joueurs` et `collection` dans la table des matières), envoyée sans
  pouvoir écraser (`ifGenerationMatch=0`, droit `objectCreator` seul) avec contrôle CRC32C. À 5 h 30, heure de Paris :
  hors de la fenêtre de maintenance de Neon (jeudi, 2 h à 3 h UTC).
- **Consommation** : lue sur l'API de Neon (`compute_time_seconds` du projet, `logical_size` des branches), jamais sur
  la base ; clé d'organisation Neon limitée au projet (secret `neon-cle-api`). Constaté le 2026-10-23 : 1 963 s de
  calcul pour 7 764 s d'activité, soit 0,25 CU ; limite de 1 Gio par branche lue sur le projet.
- **Une seule alerte sur les journaux** pour les deux jobs et leurs tâches planifiées (WARNING ou ERROR) : 0,35 $ par
  mois à partir de septembre 2027, à revoir alors.
- **Erreurs du front** : `RapporteurErreurs` remplace l'`ErrorHandler` d'Angular (qui reçoit aussi les erreurs de la
  fenêtre) et envoie par `fetch` (sans jeton ni intercepteur) message, pile, chemin de la page et version (nom du
  script `main-XXXXXXXX`) ; 5 erreurs au plus par page, sans doublon ni réponse HTTP. `POST /api/v1/erreurs`
  (contrat `erreurs.yaml`, 30 par heure et par adresse) journalise un `ReportedErrorEvent` du service `hipmaster-web`.
  Source maps : absentes du build de production (configuration par défaut d'Angular), donc hors du site publié.
- **Erreurs 500 de l'API** : déjà journalisées avec `stack_trace`, sans jeton, code ni corps (US-046,
  `journaux.test.ts`).
- **Restauration** : `scripts/gcp/restaurer.sh` (branche Neon temporaire, base vide, `pg_restore` dans l'image des
  jobs construite sur le poste, comptage, suppression de la branche).
- Le lint SonarJS refuse MD5, même pour un contrôle d'intégrité : CRC32C, que Cloud Storage vérifie aussi à la
  réception.

## Essais en ligne (2026-10-23, avec l'accord du porteur du projet)

- **Infrastructure** : `infrastructure.sh` a créé 15 éléments (2 comptes de service, droits, secret `neon-cle-api`,
  2 tâches planifiées, canal e-mail, test de disponibilité, 2 alertes), puis, après le premier déploiement des jobs,
  les droits des tâches planifiées. Deux passes de plus : stable (les deux défauts trouvés en route sont corrigés :
  corps JSON aux accents abîmés par Windows, droits du bucket mal relus). Configuration `elis` du poste intacte.
- **Jobs** : image `exploitation` poussée (paquet séparé : les images de l'API n'ont pas bougé), jobs créés par
  `deployer.sh exploitation`.
- **Consommation** : « 0,5 h-CU sur 100 (0,5 %, 4,9 prévues sur le mois), stockage 38 Mo sur 1 024 Mo (3,7 %) ».
- **Sauvegarde** : `hipmaster-2026-10-23T20-48-38Z.dump`, 14 523 octets, exécution de 19 s, base réveillée une fois.
- **Restauration** (`restaurer.sh`) : branche `restauration-20261023-204943`, base vide, archive restaurée en 9 s ;
  retrouvés : 1 compte, 1 session, 34 lignes de collection, 1 récompense, 2 invitations, 0 duel ; branche supprimée.
- **Alertes** : les deux premières exécutions en échec (projet Neon non nommé, adresse du jeton) ont écrit leur ERROR
  dans le journal, ce qui déclenche l'alerte « sauvegarde ou consommation Neon » : de vrais essais de l'e-mail.
- **Error Reporting** : une erreur écrite au format de la route `POST /api/v1/erreurs` apparaît dans un groupe du
  service `hipmaster-web`. La route elle-même part en ligne avec le merge.

## Scan OWASP ZAP de base (2026-10-23)

`zap-baseline.py` (image `ghcr.io/zaproxy/zaproxy:stable`, araignée classique et Ajax, 2 minutes) sur
`https://hipmaster.web.app` : 72 adresses, **aucune alerte élevée ni moyenne**, 0 échec, 57 règles passées.

| Alerte (ZAP)                                     | Risque     | Réponse                                                                                                                                                                                                                                                                                                                            |
| ------------------------------------------------ | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Strict-Transport-Security Header Not Set [10035] | faible     | Acceptée : seules les réponses 404 de l'API relayées par Firebase Hosting en sont privées (`GET /api/v1/joueurs`, `/sessions`) ; toutes les autres le portent (`max-age=31556926; includeSubDomains; preload`), et le domaine `.app` est dans la liste HSTS préchargée des navigateurs : aucune connexion en clair n'est possible. |
| Timestamp Disclosure - Unix [10096]              | faible     | Faux positif : des nombres du script Angular minifié (`main-….js`), pas des dates du serveur.                                                                                                                                                                                                                                      |
| Re-examine Cache-control Directives [10015]      | informatif | Voulu : `no-cache` sur `index.html` et les routes Angular (revalidées à chaque visite), `public, max-age` sur le catalogue de l'API (US-057).                                                                                                                                                                                      |
| Retrieved from Cache [10050]                     | informatif | Voulu : fichiers à empreinte servis par le CDN de Firebase avec un cache d'un an (`immutable`).                                                                                                                                                                                                                                    |
| Modern Web Application [10109]                   | informatif | Constat : application Angular ; l'araignée Ajax a été utilisée.                                                                                                                                                                                                                                                                    |

## Journal

- 2026-10-22 — création, issue de la revue avant mise en ligne (ADR 0021).
- 2026-10-23 — livrée : test de disponibilité de /api/v1/sante toutes les 15 minutes et alerte par e-mail ; jobs Cloud Run de sauvegarde de chaque nuit (pg_dump vérifié vers gs://hipmaster-sauvegardes) et de relevé de la consommation Neon (alerte à 70 %), planifiés par Cloud Scheduler ; erreurs du front vers Error Reporting par POST /api/v1/erreurs ; restauration essayée dans une branche Neon temporaire ; scan ZAP de base sans alerte élevée ni moyenne (ADR 0033)
