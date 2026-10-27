# US-085 — Rééquilibrer la carte API GraphQL

- **Epic** : EPIC-13
- **Statut** : Faite
- **Priorité** : Should
- **Taille** : S
- **Branche** : `claude/sharp-ptolemy-b65de6`

## Récit

En tant que **joueur**, je veux **que la carte API GraphQL renforce un deck sans le rendre dominant** afin de **garder
des parties disputées quel que soit le deck qui l'accueille**.

## Critères d'acceptation

- [x] **Étant donné** la mesure d'US-029 (`npm run simuler:carte -- 74`), **alors** on sait d'où vient l'écart du
      deck Héritage : de la carte elle-même ou des cartes qu'elle y remplace.
      → Les deux : l'outil retire dans Héritage deux cartes faibles (une commune 3/4 sans effet y gagne déjà 7 à 11
      points), mais à corps égal (Webhook 2/3 à la place de deux Pub/Sub dans Moderne) la carte fait gagner 18 à 20
      points : la pioche est trop forte pour 3 de Débit.
- [x] **Étant donné** la carte en cause, **alors** son coût, ses statistiques ou son plafond de pioche sont ajustés,
      sans capacité nouvelle ; si c'est l'outil, sa règle de remplacement est corrigée.
      → **4 de Débit** au lieu de 3, statistiques (2/3) et effet inchangés. Essayés et écartés : 1/3, 2/2, une seule
      carte piochée (Héritage encore +10 à +15). Règle de l'outil gardée : départager en faveur d'une paire du deck
      déplaçait l'écart vers Moderne (+18 à +20) et faisait bouger API First et EDA.
- [x] **Étant donné** deux graines à 400 parties par duel, **alors** aucun deck prêté ne gagne ni ne perd 10 points
      ou plus avec la carte, et `npm run simuler` (decks prêtés) reste entre 40 et 60 %.
      → Écarts de −6 à +3 sur les graines 1 et 2 ; `npm run simuler` : 45 à 54 % (les decks prêtés ne contiennent pas
      la carte).
- [x] Les mesures sont consignées dans `docs/produit/cartes-set-1.md` ; les textes fr et en suivent l'effet s'il
      change.
      → Section « API GraphQL passe à 4 de Débit » ; l'effet ne change pas, donc ni texte ni traduction ; l'exemple
      du guide du contributeur (`docs/contribuer/regles-cartes.md`) suit le nouveau coût.

## Notes

- Constat d'US-029 en essayant `scripts/simuler-carte.ts` sur les cartes 72 à 74 : avec deux API GraphQL, Héritage
  gagne 13 à 18 points contre chacun des trois decks prêtés (Moderne +1 à +4, Hybride +1 à +10). US-077 n'avait mesuré
  la carte que dans le deck Moderne.
- Changement de jeu : le porteur du projet valide avant fusion.
- Limite de l'outil, laissée telle quelle : une carte nouvelle à 3 de Débit prend dans Héritage la place d'Universal
  Messaging et de MWS, les plus faibles du deck ; elle y part avec 7 à 11 points d'avance sur une carte neutre. Un
  ⚠️ sur Héritage seul, pour une carte à 3 de Débit, se vérifie donc à la main contre ce témoin.

## Journal

- 2026-10-27 — création, à la suite du constat d'US-029.
- 2026-10-27 — mesures : témoins sans effet (SOAP / WSDL, Webhook) et remplacements choisis à la main pour séparer
  l'effet de l'outil de celui de la carte ; quatre réglages de la carte essayés à la graine 1 ; essai d'une règle de
  remplacement « une paire d'abord », abandonné ; coût 4 confirmé sur les graines 1 et 2.
- 2026-10-27 — livrée : API GraphQL passe à 4 de Débit (statistiques et effet inchangés) : plus aucun deck prêté ne bouge de 10 points ou plus sur deux graines ; mesures et témoins consignés dans cartes-set-1.md
