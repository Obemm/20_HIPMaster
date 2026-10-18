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
- 2026-10-18 — **essai réalisé** dans Recraft (offre gratuite, modèle V4.1 Flash, sans style imposé, format 4:3) :
  2 variantes par carte, **8 crédits sur 60**, environ 10 s par génération ; originaux en 1216 × 896 px, sans texte
  ni logo. Retenues par le porteur du projet : FTP (robot au cadenas), webMethods IS (moyeu en étoile), Apigee
  (porte-forteresse), Solace Agent Mesh (créatures lumineuses). Passées par la chaîne d'US-015 : 16 fichiers de 7 à
  71 Ko, affichés dans le catalogue et le détail. **Constat** : chaque image est réussie, mais le rendu varie d'une
  carte à l'autre (peinture texturée, dessin au trait, aplats isométriques, style « mignon ») : sans style verrouillé,
  le bloc de style commun ne suffit pas pour 71 cartes. Piste : la fonction « Créer un style » de Recraft, à partir
  des images retenues. Images et métadonnées de l'essai gardées hors des commits (propriété de Recraft).
- 2026-10-18 — **style verrouillé** : style personnalisé Recraft « Sunlit Sketches » (fonction « Créer un style »,
  disponible en offre gratuite) construit sur les 4 images retenues, puis les 4 cartes régénérées avec ce style
  (modèle V4.1, mode Flexible, consignes réduites au sujet et à la palette de la famille) : **4 crédits par paire**
  au lieu de 2, 16 crédits, il en reste 36 sur 60. **Résultat** : rendu nettement plus homogène (même fond bleu nuit,
  même trait, même halo d'une carte à l'autre), images plus légères (6 à 49 Ko). Retenues : FTP gauche, webMethods
  gauche, Apigee droite, Solace droite. Reste à trancher : l'offre (les images gratuites restent la propriété de
  Recraft) avant de produire les 71 cartes (US-017).
- 2026-10-18 — décision du porteur du projet : l'offre Recraft attend ; **pour le moment**, des illustrations simples
  générées par le code (US-018, ADR 0016). Les images de l'essai sont rangées hors du dépôt
  (`packages/illustrations/sources/recraft-essai/`).
