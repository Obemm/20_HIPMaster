# 0036 — Les fiches « En savoir plus » sont versionnées avec le catalogue et servies avec le détail d'une carte

- **Date** : 2026-10-24
- **Statut** : Acceptée
- **Référence Elis** : ADR-001 (base de connaissance de la tribu dans Confluence) — écarté : les fiches sont le
  contenu public d'un jeu, pas la documentation de la tribu ; ADR-026 (Semarchy xDM) — écarté comme pour l'ADR 0011

## Contexte

L'objectif premier du jeu est l'acculturation (EPIC-12) : chaque carte doit apprendre quelque chose de juste, sans
devenir un pavé. US-073 ajoute à chaque carte une fiche « En savoir plus » (définition, usage, exemple, piège,
ressources externes), et US-074 la rédige pour les 71 cartes. Il faut décider où vit ce contenu, comment il est
validé, comment l'API le sert et comment le front ouvre des liens vers d'autres sites. Le catalogue est déjà une donnée
versionnée du domaine (ADR 0011) ; la liste `GET /cartes` est chargée par la partie, les boosters et le catalogue,
souvent sur téléphone. Le dépôt est public (ADR 0022) et le site est soumis à une CSP stricte (`firebase.json`).

## Décision

- **Les fiches vivent dans `packages/domain/src/fiches/`**, en TypeScript typé, **un fichier par famille**, indexées
  par numéro de carte. Elles ne touchent ni aux règles ni aux statistiques : une fiche se relit et se corrige sans
  relire `set-1.ts`, famille par famille (US-074).
- **Une fonction pure `problemesFiche` fixe le format**, et les tests du domaine l'appliquent à toutes les fiches :
  champs remplis, longueurs bornées (moins d'une minute de lecture), de 1 à 3 liens `https` distincts, titrés, en
  français ou en anglais, et chaque fiche rangée dans le fichier de la famille de sa carte.
- **Le champ « Chez Elis » est facultatif** et ne reprend que des faits déjà publics dans le dépôt
  (`docs/produit/univers.md`, `cartes-set-1.md`) : rien n'est inventé ni tiré de documents internes.
- **L'API sert la fiche avec le détail d'une carte** (`GET /api/v1/cartes/{numero}`, schéma `CarteDetaillee`) et
  **pas dans la liste** `GET /api/v1/cartes`, qui reste légère. Le contrat OpenAPI passe en 1.1.0.
- **Le front déplie la fiche à la demande** : un bouton « En savoir plus » (`aria-expanded`) sous le texte « En vrai »
  du détail (catalogue, collection, carte vue depuis un booster) et du panneau de la carte choisie en partie. En partie,
  la fiche est demandée à la première ouverture seulement.
- **Les liens externes** s'ouvrent dans un nouvel onglet avec `rel="noopener noreferrer"` et `hreflang`, annoncent le
  nouvel onglet aux lecteurs d'écran, et affichent le site et la langue avant le clic. Le site ne charge rien de ces
  sites (ni aperçu, ni favicon) : **la CSP ne change pas**, une navigation de premier niveau n'y étant pas soumise.

## Alternatives envisagées

- **Champ `fiche` dans chaque carte de `set-1.ts`** : tout au même endroit, mais un fichier de plus de 2 000 lignes où
  le texte pédagogique se mêle aux règles, et une relecture par famille plus pénible.
- **Contenu en Markdown ou en base** : plus souple à rédiger, mais hors des tests du domaine (ADR 0011) ; la base
  imposerait un outil d'édition sans besoin réel.
- **Fiche incluse dans la liste du catalogue** : un aller-retour de moins en partie, mais une liste quatre fois plus
  lourde (21 Ko de JSON aujourd'hui, environ 90 Ko avec 71 fiches d'un kilo-octet), chargée à chaque partie et à chaque
  ouverture de booster, pour un contenu lu à la demande.
- **Fenêtre modale dédiée à la fiche** : une fenêtre par-dessus la fenêtre du détail, plus lourde au clavier et sur
  téléphone qu'un simple dépliant.

## Conséquences

- Corriger une fiche demande une PR, comme une carte ; c'est aussi ce qui garantit sa relecture.
- La validation des liens dans les tests est hors ligne (forme `https`) : vérifier qu'un lien répond et parle du bon
  sujet reste une étape de rédaction (script de vérification prévu par US-074).
- En partie, ouvrir une fiche coûte une requête ; hors ligne, la fiche affiche une erreur avec « Réessayer ».
- Les futures cartes de la communauté (EPIC-08) suivront le même modèle de fiche.
