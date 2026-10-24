# US-074 — Enrichir le contenu des 71 cartes du set 1

- **Epic** : EPIC-12
- **Statut** : Faite
- **Priorité** : Must
- **Taille** : L
- **Branche** : `us-074-contenu-cartes-set-1`
- **Décision** : [ADR 0036](../../decisions/0036-fiches-pedagogiques-cartes.md)

## Récit

En tant que **collègue qui découvre l'intégration**, je veux **que chaque carte m'apprenne quelque chose de juste et
d'utile** afin de **mieux comprendre les technologies, patterns et incidents de la plateforme en jouant**.

## Conception

- Les 63 fiches manquantes suivent le format d'US-073 (`packages/domain/src/fiches/`, un fichier par famille) : la
  relecture se fait **famille par famille, fichier par fichier**, dans une seule PR (huit fichiers indépendants).
- **Sources** : Wikipédia (en français quand l'article existe), documentation des éditeurs (Google Cloud Apigee,
  Solace, IBM, Anthropic), standards (RFC, OpenAPI, AsyncAPI, A2A, CA/Browser Forum), _Enterprise Integration
  Patterns_, OWASP, CNIL, Microsoft Learn. Chaque lien a été ouvert : réponse 200 et titre de page sur le bon sujet.
- **Chez Elis** : seulement les faits déjà publics dans le dépôt (`docs/produit/univers.md`, `cartes-set-1.md`) ; aucune
  doctrine interne n'est reprise, le dépôt étant public (ADR 0022).
- **Liens morts** : `npm run fiches:liens` ouvre chaque adresse (redirections suivies) et affiche statut et titre ; il
  sort en erreur si un lien ne répond pas. Il demande le réseau : ce n'est pas un test de la CI, il se lance avant
  chaque modification de fiche.
- **Texte visible des cartes** : seul celui de SFTP était inexact (« Le FTP chiffré » : SFTP passe par SSH, sans
  rapport avec FTP) ; il devient « Le transfert de fichiers chiffré par SSH, peu à peu remplacé par les API et les
  événements ».

## Critères d'acceptation

- [x] **Étant donné** chacune des 71 cartes, **alors** sa fiche « En savoir plus » (format d'US-073) est rédigée :
      définition, usage, exemple concret, piège ou bonne pratique, et au moins un lien externe.
- [x] **Étant donné** chaque lien externe, **alors** il a été ouvert et vérifié ; un test ou un script signale les
      liens morts.
- [x] **Étant donné** le texte visible de la carte, **alors** il reste court et ludique ; il est retouché seulement s'il
      était inexact.
- [x] Le contenu est relu par le porteur du projet, famille par famille (Fichiers & Batch, Messagerie & ESB, API,
      iPaaS, Événementiel, IA agentique, Patterns, Bestiaire) : une PR par famille si c'est plus simple à relire.

## Notes

- Taille L : à découper par famille au moment de l'affiner.
- Après US-073, qui fixe le format avec des cartes pilotes.
- Points à faire trancher par le porteur du projet (relevés dans la PR) : les textes « Chez Elis », le sort de SFTP
  chez Elis (le jeu le présente comme une étape vers l'API ou l'événement), et les fiches qui s'appuient sur une
  documentation d'éditeur susceptible d'évoluer (Apigee AI, Solace Agent Mesh, A2A).

## Journal

- 2026-10-23 — création, à la demande du porteur du projet.
- 2026-10-24 — affinage et rédaction des 63 fiches restantes (127 liens, 115 adresses, tous vérifiés), test « une
  fiche par carte », script `npm run fiches:liens`, texte de SFTP corrigé. En revue : relecture du porteur du projet.
- 2026-10-24 — décision du porteur du projet : SFTP est proscrit chez Elis, comme FTP, mais encore utilisé par
  beaucoup de projets ; la fiche le dit. ADR des fiches renuméroté 0036 (le 0034 est celui d'US-058).
- 2026-10-24 — livrée : fiche « En savoir plus » pour les 71 cartes du set 1 (127 liens vérifiés, npm run fiches:liens), texte de SFTP corrigé, SFTP proscrit chez Elis ; textes relus et validés par le porteur du projet
