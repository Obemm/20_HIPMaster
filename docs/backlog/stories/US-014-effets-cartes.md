# US-014 — Sorts et incidents

- **Epic** : EPIC-04
- **Statut** : En cours
- **Priorité** : Should
- **Taille** : L
- **Branche** : `us-014-effets-cartes`

## Récit

En tant que **joueur**, je veux **jouer les sorts (Patterns, prompting) et les incidents (Bestiaire)** afin de
**retourner une partie avec un Circuit Breaker, un Splitter ou un Message poison bien placé**.

## Critères d'acceptation

### Moteur (`packages/domain`)

- [ ] Une nouvelle action `jouer` joue un sort ou un incident de la main, en payant son coût, avec ses **cibles**
      éventuelles (composant allié ou adverse, carte de la défausse, SI) ; la carte part ensuite à la défausse.
- [ ] Les **12 sorts** sont appliqués : Rate limiting, Mapping de données, Chain of thought, Human-in-the-loop,
      Prompt système, Few-shot, Dead Letter Queue, Circuit Breaker, Content-Based Router, Splitter, Idempotent
      Consumer, Retry.
- [ ] Les **13 incidents** sont appliqués : Prompt injection, Mot de passe en clair, Certificat expiré, Couplage fort,
      Hallucination, Message poison, Timeout, Doublon, Fichier vide à 3 h du matin, Encodage cassé, Contexte saturé,
      Boucle d'agents, Facture de tokens.
- [ ] Les **parades** sont appliquées : Human-in-the-loop, OAuth2 (contre Certificat expiré), Fichier `.ok` témoin
      (contre Fichier vide à 3 h du matin), Vétéran (FTP n'est jamais ciblé ni touché au hasard par une carte IA).
- [ ] `actionsPossibles` propose chaque sort ou incident jouable avec chacune de ses combinaisons de cibles légales ;
      `CARTES_PRISES_EN_CHARGE` inclut ces 27 cartes (25 sorts et incidents, OAuth2 et Fichier `.ok`).
- [ ] Chaque effet et chaque parade a son test ; le hasard (Hallucination) passe par le générateur à graine.

### Bot, decks et simulation

- [ ] Le bot Batch de nuit sait jouer les sorts et les incidents (sur sa seule vue).
- [ ] Les decks prêtés intègrent des sorts et des incidents de leur univers ; une nouvelle simulation garde chaque
      duel entre 40 et 60 % de victoires, et ses résultats sont notés dans
      [cartes-set-1.md](../../produit/cartes-set-1.md).

### API et écran

- [ ] Le contrat OpenAPI et le schéma de l'action acceptent `jouer` avec ses cibles.
- [ ] À l'écran, une carte de sort ou d'incident propose une action par cible possible (« Jouer sur … ») ; le
      journal raconte l'effet obtenu. Parcours e2e et audit axe-core au vert.

## Notes

- **Découpage** (2026-10-18) : l'US-014 d'origine (« effets des sorts, des incidents et des cartes IA ») couvrait
  une quarantaine d'effets ; elle est découpée en trois. Les effets propres des composants passent dans
  [US-019](US-019-effets-composants.md), les capacités IA et Migration dans [US-020](US-020-capacites-ia.md).
- Les actions restent explicites (ADR 0013) : `jouer` s'ajoute à `poser`, `evoluer`, `decommissionner`, `attaquer`
  et `finirTour`.
- Deux textes de cartes sont précisés pour être jouables sans ambiguïté (à reporter dans
  [cartes-set-1.md](../../produit/cartes-set-1.md)) : **Prompt injection** fait attaquer aussitôt un agent adverse
  contre une cible de son propre camp (composant ou SI) ; **Mot de passe en clair** cible un composant Fichiers
  adverse, détruit si c'est FTP, sinon blessé de 2.

## Journal

- 2026-10-18 — création (découpage d'EPIC-04).
- 2026-10-18 — story découpée : ne garde que les sorts, les incidents et leurs parades ; US-019 et US-020 créées.
