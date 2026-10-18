# US-016 — Direction artistique et choix du générateur d'images

- **Epic** : EPIC-05
- **Statut** : En cours
- **Priorité** : Should
- **Taille** : M
- **Branche** : `us-016-direction-artistique`

## Récit

En tant que **porteur du projet**, je veux **un style d'illustration défini et un outil dont j'ai le droit d'utiliser
les images** afin que **les 71 cartes forment un set cohérent, sans risque sur la propriété des images**.

## Critères d'acceptation

- [ ] Un ADR tranche l'outil de génération : **Recraft** (piste de départ) ou une autre solution, avec l'offre
      retenue, son coût et la **propriété des images**.
- [ ] La direction artistique tient sur une page (`docs/produit/direction-artistique.md`) : style, palette par
      famille (cohérente avec les couleurs d'accent d'US-009), cadrage 4:3, ce qu'on montre ou non (pas de logo de
      produit, pas de personne réelle reconnaissable, pas de texte dans l'image).
- [ ] Une consigne de génération type par famille, et la règle pour écrire le texte alternatif d'une carte.
- [ ] Un essai sur **4 cartes de familles différentes** (par exemple FTP, webMethods IS, Apigee, Solace Agent Mesh),
      validé par le porteur du projet, passé par la chaîne d'US-015.

## Notes

- **Licence Recraft** (vérifiée le 2026-10-18 sur la page des tarifs, à reconfirmer au moment de l'achat) : avec
  l'offre **gratuite**, les images **appartiennent à Recraft** et sont publiques dans sa galerie, sans usage
  commercial ; avec une **offre payante** (abonnement ou API à l'usage), elles appartiennent à l'abonné, avec les
  droits commerciaux, même après la fin de l'abonnement. → L'offre gratuite est exclue, même pour un jeu interne.
- Recraft permet de créer un **style personnalisé** réutilisable (aussi par API) : c'est le moyen d'obtenir un set
  cohérent.
- Référentiel Elis : ADR-033 (règles d'usage des assistants d'IA) — aucune donnée d'entreprise dans les consignes ;
  ADR-019 (Figma) à considérer pour le gabarit de carte.
- Décision attendue du porteur du projet : souscrire à une offre payante de Recraft, ou choisir une autre voie
  (illustrations vectorielles faites à la main, autre générateur).

## Journal

- 2026-10-18 — création, au découpage d'EPIC-05.
- 2026-10-18 — le porteur du projet choisit d'**essayer l'offre gratuite** de Recraft. Conséquences : pas d'API (les
  images se génèrent à la main dans l'interface web) et images **propriété de Recraft**, publiques : elles servent à
  juger le style et ne sont **pas commitées** ; le set final demandera une offre payante ou une autre voie.
  Brouillon de [direction artistique](../../produit/direction-artistique.md) et consignes des 4 cartes d'essai.
