# US-062 — Ouvrir un booster, un vrai moment

- **Epic** : EPIC-10
- **Statut** : Faite
- **Priorité** : Could
- **Taille** : M
- **Branche** : `us-062-ouverture-booster-mise-en-scene`

## Récit

En tant que **joueur**, je veux **découvrir mes cartes une à une quand j'ouvre un booster** afin de **ressentir le
plaisir de la découverte, surtout pour une carte rare**.

## Contexte

Constat de la revue du 2026-10-22 : l'écran « Mes boosters » est un texte (« 5 boosters en stock ») et un bouton ;
l'ouverture affiche d'un coup la grille des 5 cartes avec une étiquette « Nouvelle ! ». C'est le moment fort d'un
jeu de cartes à collectionner (WikiMasters, voir `docs/produit/inspirations.md`).

## Critères d'acceptation

- [x] **Étant donné** des boosters en stock, **alors** l'écran les montre comme des paquets (visuel), avec le stock
      et le temps avant le prochain booster gratuit.
- [x] **Étant donné** un booster ouvert, **quand** les cartes arrivent, **alors** elles se révèlent une à une (geste
      ou appui), la rareté se voit avant le retournement, et une carte épique ou légendaire a un effet plus marqué.
- [x] **Étant donné** un joueur pressé, **alors** un bouton « Tout révéler » montre les 5 cartes d'un coup.
- [x] **Étant donné** la préférence système « réduire les animations », **alors** aucune animation n'est jouée.
- [x] Le tirage reste fait par le serveur (ADR 0004, 0019) : l'animation ne change rien au résultat.
- [x] **Étant donné** un lecteur d'écran ou le clavier, **alors** chaque carte cachée est un bouton qui dit sa
      rareté (« Retourner la carte 1 : Rare »), la carte retournée est annoncée (« Carte 1 : FTP, légendaire,
      nouvelle ! ») et le focus passe à la suivante, puis au bilan.

## Décisions

- **Le tirage reste entier côté serveur** : la réponse de `POST /moi/boosters/ouvertures` arrive avant la mise en
  scène, qui ne fait que retarder l'affichage ; la collection est déjà à jour quand la première carte se retourne.
- **La rareté se lit au dos** : liseré de la couleur du cadre de rareté, halo pour les épiques et les légendaires,
  et la rareté en toutes lettres sous la carte, avec son symbole (la couleur n'est jamais seule).
- **Les « Nouvelle ! » n'apparaissent qu'une fois la carte retournée**, et le titre ne compte les nouvelles qu'à la
  fin (« 5 cartes à retourner », puis « 5 cartes, 2 nouvelles ») : pas de surprise gâchée.
- **Effets** : distribution des cartes une à une, retournement en pivot, éclat de lumière derrière une épique et plus
  grand derrière une légendaire, paquet qui tremble pendant l'ouverture. Tous sous
  `prefers-reduced-motion: no-preference` : sans animation, les cartes se retournent d'un coup, sans mouvement.
- **Les paquets en stock** sont dessinés en CSS (feuille métallisée, dentelures, logo, « Set 1 ») : cinq au plus en
  éventail, le nombre exact est écrit à côté ; un paquet grisé quand le stock est vide.

## Captures

- [Le déroulé sur téléphone, avant / après](../../produit/captures/us-062-ouverture-tel-avant-apres.jpg)
- [Au bureau](../../produit/captures/us-062-ouverture-bureau.jpg)

## Journal

- 2026-10-22 — création, issue de la revue du design avant mise en ligne.
- 2026-10-24 — affinée et commencée (session de nuit, sur la charte d'US-061 et US-068).
- 2026-10-24 — livrée : Paquets dessinés, cartes face cachée qui se retournent une à une ou toutes d'un coup, rareté au dos, éclat des épiques et légendaires, annonces et focus pour le clavier et les lecteurs d'écran, animations coupées sur demande.
