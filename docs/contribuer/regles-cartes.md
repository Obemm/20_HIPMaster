# Concevoir une carte HIPMaster

Ce guide s'adresse aux architectes et tech leads qui veulent proposer une carte : une technologie, un pattern ou un
incident vécu, avec un texte qui explique ce qu'il représente dans un SI. Il suffit de connaître ce que l'on veut
raconter : pas besoin de lire le code du jeu. La démarche (fork, consignes pour votre IA, pull request) est décrite
dans [CONTRIBUTING.md](../../CONTRIBUTING.md) ; la décision qui la fonde, dans l'ADR
[0050](../decisions/0050-cartes-communaute-par-pull-request.md).

Pour jouer avant de proposer : [règles du jeu](../produit/regles.md), [univers](../produit/univers.md) et
[catalogue actuel](../produit/cartes-set-1.md).

## Ce qui fait une bonne carte

- **Elle apprend quelque chose de vrai.** Le joueur doit comprendre ce qu'est la technologie, ou pourquoi l'incident
  arrive, en lisant la carte. Sa mécanique raconte la même chose que son texte : un batch est lent mais fort, une
  passerelle d'API protège le SI, un agent agit seul.
- **Elle est jouable.** Ni indispensable, ni inutile : elle trouve sa place dans un deck sans écraser les cartes de
  même coût.
- **Elle est nouvelle.** Elle ne double pas une carte existante (vérifier le [catalogue](../produit/cartes-set-1.md)).

## Les éléments d'une carte

### Famille

Huit familles : six époques de l'intégration, puis deux familles transverses.

| Famille            | Code        | Exemples                                  | Mécanique typique               |
| ------------------ | ----------- | ----------------------------------------- | ------------------------------- |
| Fichiers & Batch   | `fichiers`  | FTP, SFTP, CSV, EDI, cron                 | Batch : lent mais fort          |
| Messagerie & ESB   | `esb`       | webMethods Integration Server, JMS        | Hub : bonus, point unique       |
| API                | `api`       | Apigee, REST, OpenAPI, OAuth2, GraphQL    | Garde : protège le SI           |
| iPaaS              | `ipaas`     | webMethods.io, connecteurs SaaS, low-code | Connecteur : fait piocher       |
| Événementiel (EDA) | `eda`       | Solace Event Mesh, topic, file, CDC       | Diffusion : plusieurs cibles    |
| IA agentique       | `ia`        | LLM, MCP, A2A, Solace Agent Mesh          | Autonome : agit seul            |
| Patterns           | `patterns`  | Router, Splitter, Circuit Breaker, DLQ    | sorts                           |
| Bestiaire          | `bestiaire` | Message poison, Timeout, Prompt injection | incidents, et quelques monstres |

### Type

- **Composant** : se pose sur le plateau (5 emplacements), avec une attaque et des PV ; il attaque à partir du tour
  suivant. C'est le type d'une technologie.
- **Évolution** : se pose **à la place** d'un composant précis (sa forme modernisée), avec ses PV pleins. Rare : elle
  suppose une lignée claire (Apigee API Gateway → Apigee AI Gateway).
- **Sort** : effet immédiat, puis défausse. C'est le type d'une pratique, d'un pattern, d'une façon de concevoir.
- **Incident** : effet contre l'adversaire, puis défausse. C'est le type d'une panne ou d'un risque (Bestiaire).

### Rareté

| Rareté     | Dans un booster | À viser pour…                                              |
| ---------- | --------------- | ---------------------------------------------------------- |
| Commune    | 70 %            | une brique de base, simple, sans capacité ou avec une      |
| Rare       | 22 %            | une technologie ou un pattern qui a une vraie mécanique    |
| Épique     | 7 %             | une pièce maîtresse, qui change une partie                 |
| Légendaire | 1 %             | une carte mythique ; une seule par deck (à éviter d'abord) |

Le relecteur peut ajuster la rareté visée : la plupart des propositions sont communes ou rares.

### Statistiques

Le **coût** se paie en Débit (1 au premier tour, +1 par tour, 10 au plus). L'**attaque** est infligée à la cible, les
**PV** sont les points de vie du composant. Ordres de grandeur relevés sur les 74 cartes du catalogue (minimum–maximum,
moyenne entre parenthèses) :

| Type et rareté       | Cartes | Coût      | Attaque   | PV        | Capacités |
| -------------------- | ------ | --------- | --------- | --------- | --------- |
| Composant commun     | 21     | 1–3 (1,9) | 0–3 (1,5) | 1–5 (2,8) | 0 ou 1    |
| Composant rare       | 18     | 2–5 (3,2) | 1–5 (2,3) | 3–5 (3,7) | 0 ou 1    |
| Composant épique     | 4      | 4–5 (4,8) | 2–6 (3,8) | 4–7 (6,0) | 0 à 3     |
| Évolution légendaire | 3      | 5–6 (5,3) | 3–5 (4,0) | 7–8 (7,3) | 2 à 5     |
| Sort commun          | 7      | 1–2 (1,3) | —         | —         | —         |
| Sort rare            | 5      | 1–3 (2,0) | —         | —         | —         |
| Sort épique          | 2      | 3         | —         | —         | —         |
| Incident commun      | 8      | 1–2 (1,3) | —         | —         | —         |
| Incident rare        | 4      | 2–3 (2,3) | —         | —         | —         |

Repère simple pour un composant sans capacité : attaque + PV ≈ 2 × coût + 1. Une capacité forte ou un effet se paie
par 1 de coût en plus, ou par une statistique plus basse. Les chiffres proposés restent indicatifs : l'équilibrage se
mesure par simulation pendant la relecture.

### Capacités et effet

Les **capacités** sont des mots-clés du glossaire, déjà programmés : Batch, Vétéran, Non conforme, Sur site, Hub,
Point unique, Garde, Quotas, Connecteur (N), Diffusion, Réactif, File durable, Supervision, Migration, Autonome,
Orchestration, Outillage, Délégation, Contexte, Garde-fous, Asynchrone, Cache sémantique, Routage multi-modèles. Leur
effet exact est dans le [tableau des capacités](../produit/regles.md#capacités).

- Une carte en porte **zéro, une, rarement deux** ; choisir celles qui racontent la technologie.
- **Une capacité nouvelle n'est jamais créée par une proposition de carte** : elle touche tout le moteur et fait
  l'objet d'une story à part. Si votre idée l'exige, dites-le dans la proposition.

Un **effet** est une phrase propre à la carte, quand aucune capacité ne suffit ; c'est le cas de tous les sorts et
incidents. Il est programmé dans le moteur avec la carte : le garder **court, d'une seule action** (piocher, infliger
des dégâts, donner un bonus, immobiliser, renvoyer en main) et proche d'effets existants. Exemples : « Infligez 2
dégâts à un composant », « Piochez les deux premières cartes API de votre pioche ».

### Le texte « En vrai »

C'est le cœur pédagogique de la carte : ce que la technologie fait **en vrai**, en une phrase de 110 caractères au
plus, lisible par quelqu'un qui n'est pas du métier. Un trait d'humour d'équipe est bienvenu s'il reste juste.

- Bien : « Un seul point d'entrée : le client demande exactement les champs voulus, en une requête sur plusieurs
  sources. »
- À éviter : « Langage de requête pour API basé sur un schéma typé avec résolveurs. » (exact, mais incompréhensible
  pour un non-spécialiste) ; « La meilleure techno du monde. » (rien appris).

### La fiche « En savoir plus »

Chaque carte a une fiche, ouverte depuis son détail (ADR [0036](../decisions/0036-fiches-pedagogiques-cartes.md)), qui
se lit en moins d'une minute : exacte plutôt que ludique.

| Champ      | Contenu                                                                 | Longueur max |
| ---------- | ----------------------------------------------------------------------- | ------------ |
| Définition | ce que c'est, en une phrase                                             | 220 car.     |
| Usage      | à quoi ça sert ; pour un incident, comment il survient                  | 360 car.     |
| Exemple    | un cas concret, tiré de la vie d'une équipe d'intégration               | 360 car.     |
| À retenir  | le piège à éviter ou la bonne pratique                                  | 320 car.     |
| En interne  | facultatif : le lien avec l'intégration en interne, **s'il est public**  | 240 car.     |
| Liens      | 1 à 3 ressources `https` (Wikipédia, documentation d'éditeur, standard) | —            |

Le total ne dépasse pas 1 300 caractères. Le jeu est bilingue : votre IA écrit aussi la version anglaise de la carte
et de la fiche.

## Règles de contenu

**Le dépôt est public, et une pull request l'est dès son ouverture**, avant toute relecture. Vérifiez donc vous-même,
avant d'ouvrir la PR, que la carte, sa fiche et son illustration ne contiennent rien de ce qui suit.

- **Rien de confidentiel** : ni nom de serveur, d'environnement ou de machine ; ni adresse, URL interne ou nom de
  domaine interne ; ni client, partenaire ou fournisseur identifiable ; ni faille non corrigée ; ni volumétrie,
  incident daté ou chiffre interne ; ni nom de collègue. Les noms de produits du marché et leurs versions publiques
  sont admis (ADR [0022](../decisions/0022-depot-public.md)).
- **Un incident se raconte en généralités** : « un certificat expire un vendredi soir » plutôt que l'incident réel de
  telle application.
- **Aucune marque dénigrée** : on peut dire qu'une technologie vieillit ou coûte cher, pas qu'un éditeur est mauvais.
  Les vrais noms de produits sont permis, jamais leurs logos.
- **Un ton bienveillant** : l'humour vise les situations, jamais des personnes ou des équipes.
- **Un texte compréhensible par un non-spécialiste**, sans sigle laissé sans explication.
- **Rien de vous dans les consignes données à l'IA** au-delà de la proposition elle-même (règles d'usage des
  assistants IA, [ref] de l’entreprise).

## Gabarit de proposition

À remplir avant tout, puis à donner à votre IA et à reprendre dans la description de la PR.

```markdown
- Nom de la carte :
- Famille : (fichiers, esb, api, ipaas, eda, ia, patterns, bestiaire)
- Type : (composant, évolution de …, sort, incident)
- Rareté visée : (commune, rare, épique, légendaire)
- Coût / Attaque / PV : (attaque et PV pour un composant ou une évolution seulement)
- Capacités : (mots-clés du glossaire, ou aucune)
- Effet : (une phrase, ou aucun)
- En vrai : (une phrase, 110 caractères au plus)
- Fiche « En savoir plus » : définition, usage, exemple, à retenir, en interne (facultatif), 1 à 3 liens
- Idée d'illustration : (la créature, sa posture, son décor)
- Sources : (où vérifier ce que dit la carte)
- Auteur affiché : (le nom qui apparaîtra sur la carte)
```

## Deux exemples commentés

### Une bonne carte : API GraphQL (n° 74)

| Famille | Type      | Rareté | Coût | Attaque / PV | Effet                                                                                    |
| ------- | --------- | ------ | ---- | ------------ | ---------------------------------------------------------------------------------------- |
| API     | Composant | Rare   | 3    | 2 / 3        | Quand elle est posée, piochez une carte par autre composant en jeu chez vous (2 au plus) |

En vrai : « Un seul point d'entrée : le client demande exactement les champs voulus, en une requête sur plusieurs
sources. »

- **La mécanique raconte la technologie** : une requête qui agrège plusieurs sources devient une pioche qui grandit
  avec les composants déjà en jeu.
- **Les statistiques sont modestes** (2 / 3 pour 3 de Débit, sous le repère) parce que l'effet rapporte des cartes.
- **Pas de capacité nouvelle** : un effet court, de la même famille que la pioche ciblée d'Apigee API Hub.

### Une carte retravaillée : API First (n° 72)

Proposition de départ : sort rare, **2 de Débit**, « Piochez la première carte API de votre pioche, puis un de vos
composants API gagne +1 attaque. »

- **Première mesure** : trop faible, le deck qui la jouait perdait plus souvent (44 à 48 % de victoires).
- **Deuxième essai** : deux cartes piochées pour 2 de Débit : trop forte (53 à 59 %).
- **Version publiée** : deux cartes piochées pour **3 de Débit**, entre 43 et 50 %. Le texte « En vrai » a été
  raccourci pour tenir sur la carte : « Concevoir le contrat de l'API avant le code : fournisseur et consommateurs
  avancent en parallèle. »

C'est le cas le plus courant : l'idée est bonne, la relecture ajuste un chiffre. Les mesures complètes sont dans le
[catalogue](../produit/cartes-set-1.md#extension--api-first-eda-et-api-graphql-us-077-2026-10-25).

## Ce que devient une proposition

1. **Pull request** : vous ouvrez la PR depuis votre fork, avec le gabarit rempli (voir
   [CONTRIBUTING.md](../../CONTRIBUTING.md)). La CI vérifie que le catalogue reste cohérent.
2. **Relecture** : le porteur du projet relit l'exactitude, le texte « En vrai », la confidentialité, l'absence de
   doublon et l'illustration. Réponse visée en moins de deux semaines : **fusionnée**, **à retravailler** (avec des
   commentaires dans la PR) ou **refusée** (avec un motif).
3. **Équilibrage** : une simulation « bot contre bot » mesure la carte dans les decks prêtés ; le coût ou les
   statistiques peuvent être ajustés, comme pour API First.
4. **Publication** : à la fusion, la carte est mise en ligne automatiquement. Elle prend le numéro suivant du
   catalogue et peut sortir des boosters.
5. **Crédit** : votre nom affiché accompagne la carte (« Proposée par … »).

**Pas de compte GitHub, ou pas le temps ?** Envoyez le gabarit rempli au porteur du projet, par message ou en
atelier : il intégrera la carte lui-même, avec votre nom.
