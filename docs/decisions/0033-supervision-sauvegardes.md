# 0033 — Supervision et sauvegardes : alertes Cloud Monitoring, jobs d'exploitation, erreurs par le journal

- **Date** : 2026-10-23
- **Statut** : Proposée
- **Complète** : [0021](0021-hebergement-gcp.md) (hébergement, sauvegarde de chaque nuit, suivi du quota Neon),
  [0024](0024-infrastructure-script-gcloud.md) (infrastructure par script) et
  [0028](0028-deploiement-continu.md) (déploiement)
- **Référence Elis** : ADR-006 (Application Insights et Log Analytics) — adapté : Cloud Logging, Error Reporting et
  Cloud Monitoring ; ADR-012 (Storage Account pour les fichiers) — adapté : les archives vont dans Cloud Storage ;
  ADR-009 (SMTP Azure pour les e-mails) — écarté : les e-mails partent des canaux de Cloud Monitoring ; ADR-043 (DAST)
  — adapté : scan OWASP ZAP de base avant l'ouverture, puis à chaque version majeure

## Contexte

L'ADR 0021 promet, avant d'inviter les collègues : une alerte quand le jeu tombe, une sauvegarde de chaque nuit dont
la restauration est essayée (l'historique de Neon Free ne couvre que 6 heures), le suivi du quota Neon (100 heures-CU
par mois, base suspendue jusqu'au mois suivant s'il est épuisé) et les erreurs dans Error Reporting. Contraintes :

- **ne jamais réveiller la base à intervalle régulier** : une connexion toutes les 15 minutes l'empêcherait de se
  mettre en veille et épuiserait le quota ;
- **0 €** : Cloud Scheduler offre 3 tâches gratuites par compte de facturation (sauvegarde, relevé de consommation, et
  la purge d'US-054) ; Cloud Monitoring facturera ses alertes à partir du 1er septembre 2027 (0,35 $ par mois et par
  condition), sauf celles qui portent sur les tests de disponibilité, qui restent gratuites ;
- tout passe par les scripts (ADR 0024, 0028), sans clé ni adresse e-mail dans le dépôt public (ADR 0022) ;
- l'image de l'API est purgée au-delà de 2 versions (US-049) : un job qui la garderait cesserait de démarrer.

## Décision

| Besoin                  | Choix                                                                                                                                                                                                         |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Disponibilité           | Test de disponibilité Cloud Monitoring sur `https://hipmaster.web.app/api/v1/sante` (route sans base), toutes les 15 minutes depuis 3 régions ; alerte quand 2 régions sur 3 échouent deux tours de suite     |
| Sauvegarde              | Job Cloud Run `hipmaster-sauvegarde`, chaque nuit à 5 h 30 (Paris) : `pg_dump --format=custom`, archive vérifiée (signature, données de `joueurs` et `collection`), puis rangée dans le bucket (30 jours)     |
| Consommation Neon       | Job Cloud Run `hipmaster-consommation`, chaque matin à 8 h : compteurs du mois lus sur l'**API de Neon** (jamais la base), avec une clé d'organisation limitée au projet ; WARNING au-delà de 70 %            |
| Alertes des jobs        | **Une seule** alerte sur les journaux : WARNING ou ERROR d'un des deux jobs, ou ERROR d'une de leurs tâches planifiées → un e-mail, au plus un par heure                                                      |
| Erreurs de l'API        | Journal ERROR avec `stack_trace` (US-046), qu'Error Reporting lit sans configuration                                                                                                                          |
| Erreurs du front        | Gestionnaire d'erreurs Angular → `POST /api/v1/erreurs` (30 par heure et par adresse, 5 par page au plus) → journal au format `ReportedErrorEvent`, service `hipmaster-web` ; ni jeton ni paramètres d'URL    |
| Image des jobs          | Image `exploitation` (Node 24 et client PostgreSQL 18), étiquetée par l'empreinte Git de `scripts/exploitation` : reconstruite seulement quand ces sources changent, donc jamais purgée tant qu'elle sert     |
| Comptes et droits       | Un compte de service par job ; la sauvegarde lit le secret de la base et **ajoute** des objets au bucket (`objectCreator` : ni lecture, ni remplacement, ni suppression) ; chaque compte ne lance que son job |
| Restauration            | `scripts/gcp/restaurer.sh` : branche Neon temporaire, base vide, `pg_restore`, comptage des comptes et collections, puis suppression de la branche                                                            |
| Scan de sécurité (DAST) | OWASP ZAP de base (`zap-baseline.py`, Docker) sur le site en ligne, avant l'ouverture puis à chaque version majeure ; alertes acceptées justifiées dans la story                                              |

`scripts/gcp/infrastructure.sh` crée les comptes, droits, secret, tâches planifiées, canal e-mail, test et alertes ;
`scripts/gcp/deployer.sh exploitation`, dernière étape du déploiement, construit l'image si besoin et met à jour les
deux jobs. L'adresse des alertes arrive par l'environnement (`HIPMASTER_ALERTES`, par défaut le compte Google).

## Alternatives envisagées

- **Relevé de consommation par une requête SQL ou une sonde sur la base** : réveillerait la base. Écarté.
- **Sauvegarde et relevé dans un même job** : libérerait une tâche planifiée, mais un échec de l'un priverait de
  l'autre, et le relevé n'a pas à lire la base. Écarté.
- **Les jobs dans l'image de l'API** : une seule image, mais purgée après deux déploiements, et `pg_dump` livré avec
  l'API. Écarté.
- **Une image Docker Hub (`postgres:18`) et un script passé en argument** : pas d'image à construire, mais un script
  shell sans tests et une dépendance de production à Docker Hub. Écarté.
- **Une alerte par job, ou une métrique d'exécutions en échec** : plus fin, mais deux conditions de plus à facturer en
  2027 pour un message de toute façon détaillé par le journal. Écarté.
- **Error Reporting par sa bibliothèque cliente dans le front** : demanderait une clé d'API publique dans le site.
  Écarté au profit de la route de l'API, limitée en débit.
- **Uptime Kuma, Better Stack ou autre service externe** : un compte de plus, et la base n'y gagne rien. Écarté.

## Conséquences

- **Coût** : 8 640 exécutions du test par mois (1 million gratuites) ; deux jobs de quelques secondes par jour, dans
  les quotas gratuits de Cloud Run ; quelques mégaoctets d'archives. À partir de septembre 2027, l'alerte sur les
  journaux coûtera 0,35 $ par mois : à revoir à ce moment-là (budget de 1 €).
- **Réveils de la base** : un seul par jour, celui de la sauvegarde, qui vérifie du même coup que la base répond.
  Le test de disponibilité réveille l'API (Cloud Run), jamais la base.
- **Ordre de création** : les jobs naissent au déploiement ; le script d'infrastructure, relancé ensuite, donne aux
  tâches planifiées le droit de les lancer (il le signale tant qu'ils manquent).
- **Clé de l'API Neon** : créée une fois par le script, jamais affichée ; limitée au projet, elle peut néanmoins
  administrer ses branches. Elle se révoque dans la console Neon.
- **Restauration** : manuelle, depuis un poste avec Docker ; essayée une fois avant l'ouverture (US-051).
- **Erreurs du front** : piles minifiées, les source maps restant hors du site publié ; la version est le nom du script
  principal (`main-XXXXXXXX`).
