# US-074 — Enrichir le contenu des 71 cartes du set 1

- **Epic** : EPIC-12
- **Statut** : À affiner
- **Priorité** : Must
- **Taille** : L
- **Branche** : `us-074-contenu-cartes-set-1`

## Récit

En tant que **collègue qui découvre l'intégration**, je veux **que chaque carte m'apprenne quelque chose de juste et
d'utile** afin de **mieux comprendre les technologies, patterns et incidents de la plateforme en jouant**.

## Critères d'acceptation

- [ ] **Étant donné** chacune des 71 cartes, **alors** sa fiche « En savoir plus » (format d'US-073) est rédigée :
      définition, usage, exemple concret, piège ou bonne pratique, et au moins un lien externe.
- [ ] **Étant donné** chaque lien externe, **alors** il a été ouvert et vérifié ; un test ou un script signale les
      liens morts.
- [ ] **Étant donné** le texte visible de la carte, **alors** il reste court et ludique ; il est retouché seulement s'il
      était inexact.
- [ ] Le contenu est relu par le porteur du projet, famille par famille (Fichiers & Batch, Messagerie & ESB, API,
      iPaaS, Événementiel, IA agentique, Patterns, Bestiaire) : une PR par famille si c'est plus simple à relire.

## Notes

- Taille L : à découper par famille au moment de l'affiner.
- Après US-073, qui fixe le format avec des cartes pilotes.

## Journal

- 2026-10-23 — création, à la demande du porteur du projet.
