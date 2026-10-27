# US-027 — Guide du contributeur : les règles de création d'une carte

- **Epic** : EPIC-08
- **Statut** : Prête
- **Priorité** : Should
- **Taille** : S
- **Branche** : `us-027-guide-contributeur`

## Récit

En tant qu'**architecte qui veut proposer une carte**, je veux **un guide clair des règles de création** afin de
**concevoir une carte juste, jouable et pédagogique sans avoir à lire le code du jeu**.

## Critères d'acceptation

- [ ] Un `CONTRIBUTING.md` à la racine présente en quelques lignes la démarche (fork, kit, PR) et renvoie au guide
      `docs/contribuer/regles-cartes.md` ; le `README.md` y renvoie aussi.
- [ ] Le guide explique en une page : familles, types de carte, raretés, statistiques (Débit, Attaque, PV) et
      capacités existantes, avec leurs **ordres de grandeur par rareté** relevés sur le catalogue actuel.
- [ ] Il donne un **gabarit** de proposition : nom, famille, type, rareté visée, statistiques, capacités, effet
      éventuel, texte « En vrai » (3 lignes au plus), fiche « En savoir plus » (ADR 0036), sources, nom d'auteur affiché.
- [ ] Il fixe les **règles de contenu** : rien de confidentiel (noms de serveurs, adresses, clients, failles non
      corrigées, données internes), le dépôt étant public **dès l'ouverture de la PR** ; pas de marque dénigrée ; un
      ton bienveillant ; un texte compréhensible par un non-spécialiste.
- [ ] Il montre **deux exemples commentés** tirés du catalogue (une bonne carte, et une carte retravaillée).
- [ ] Il explique le cycle de vie d'une proposition : PR, relecture, équilibrage, illustration validée, fusion,
      mise en ligne et crédit ; et l'alternative pour qui ne passe pas par GitHub (proposition par message, intégrée
      par le porteur du projet).

## Notes

- ADR [0050](../../decisions/0050-cartes-communaute-par-pull-request.md) ; s'appuyer sur
  [regles.md](../../produit/regles.md), [univers.md](../../produit/univers.md) et
  [cartes-set-1.md](../../produit/cartes-set-1.md).
- Documentation seule : pas de page dans le jeu (le plan initial en prévoyait une, inutile pour des contributeurs qui
  passent par GitHub).

## Journal

- 2026-10-19 — création (EPIC-08, à traiter plus tard).
- 2026-10-27 — affinage (ADR 0050) : le guide vise des contributeurs qui passent par une PR ; plus de page dans le jeu.
