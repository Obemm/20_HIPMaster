# Règles du jeu

Combat sur plateau, à deux (un joueur contre le bot, puis contre un autre joueur). Décision : [ADR 0010](../decisions/0010-combat-plateau.md).
Univers : [univers.md](univers.md). Premier set : [cartes-set-1.md](cartes-set-1.md).

## But

Chaque joueur défend son **SI**, qui a **20 points de SLA**. Le premier qui ramène le SLA adverse à 0 gagne.
Après 20 tours (10 pour chaque joueur), le joueur qui a le plus de SLA gagne (égalité : partie nulle).

## Le deck

- **20 cartes**, au plus 2 exemplaires d'une même carte, 1 seul par légendaire.
- Tant que la collection est petite, un deck de départ est prêté.

## La ressource : le Débit

- Au début de chacun de ses tours, le joueur reçoit du **Débit** : 1 au premier tour, puis +1 par tour (maximum 10).
  Le Débit non dépensé est perdu.
- Une fois par tour, on peut **décommissionner** une carte de sa main : elle part à la défausse et rapporte du Débit
  pour ce tour (+1 commune ou rare, +2 épique, +3 légendaire).

## Déroulement d'un tour

1. **Pioche** d'une carte (le joueur qui commence ne pioche pas à son premier tour). Main de départ : 4 cartes, main
   de 8 cartes au plus.
2. **Débit** : recharge, puis effets « au début de votre tour ».
3. **Jouer des cartes** en payant leur coût en Débit, dans l'ordre voulu :
   - **Composant** : posé sur le plateau (5 emplacements). Il a une **attaque** et des **PV**.
   - **Sort** (Patterns, prompting…) : effet immédiat, puis défausse.
   - **Incident** (Bestiaire) : effet contre l'adversaire, puis défausse.
   - **Évolution de X** : se pose **à la place** de X sur votre plateau, avec ses PV pleins ; elle peut attaquer ce
     tour-ci si X le pouvait.
4. **Attaquer** : chaque composant peut attaquer une fois, sauf le tour où il est posé.
   - Contre un **composant** : chacun inflige son attaque à l'autre (riposte). À 0 PV, un composant est détruit.
   - Contre le **SI** : le SLA adverse perd l'attaque du composant, sans riposte.
   - Tant que l'adversaire a un composant avec **Garde**, il faut l'attaquer en premier.

Les dégâts restent d'un tour à l'autre. Tout le hasard (pioche, cibles au hasard) est tiré par le serveur (ADR 0004).

## Précisions (tranchées en codant le moteur, US-010)

- **Pioche vide** : le joueur ne pioche pas, sans autre pénalité.
- **Main pleine** : une carte piochée en trop part à la défausse ; File durable ne peut pas ramener une carte dans
  une main pleine (elle part à la défausse).
- **Attaque nulle** : un composant dont l'attaque vaut 0 ne peut pas attaquer.
- **Évolution** : la carte d'origine part à la défausse ; l'évolution arrive avec ses PV pleins et garde l'état
  d'attaque de l'origine (posée depuis combien de temps, déjà attaqué ce tour ou non).
- **Diffusion** : les 2 composants blessés en plus sont tirés au hasard parmi les autres composants adverses.
- **Réactif** : le dégât est infligé à l'attaquant après l'échange de dégâts, s'il est encore en jeu ; un seul
  Réactif se déclenche par attaque.
- **Point unique** : les destructions qu'il provoque peuvent en entraîner d'autres, en cascade.
- **Non conforme** se cumule (2 cartes : 2 SLA par tour) ; **Sur site** prélève l'entretien automatiquement, carte
  par carte, tant qu'il reste du Débit.

## Sorts et incidents (US-014)

- Un sort ou un incident se joue en payant son coût, avec ses cibles éventuelles, puis part à la défausse.
- « À son prochain tour » : l'effet dure jusqu'à la fin du prochain tour du propriétaire du composant visé.
- Une **parade** annule l'effet mais pas le coût : la carte est quand même jouée et défaussée.
- Les effets qui touchent « au hasard » (Hallucination) tirent leur cible dans les deux camps, SI compris, jamais un
  composant Vétéran.

## Capacités

| Capacité                  | Effet                                                                                                                                              |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Batch**                 | Ne peut pas attaquer deux tours de suite.                                                                                                          |
| **Vétéran**               | Ne peut pas être ciblé par les cartes de la famille IA agentique ni par les incidents IA.                                                          |
| **Non conforme**          | Au début de votre tour, votre SI perd 1 SLA tant que la carte est en jeu.                                                                          |
| **Sur site**              | Au début de votre tour, payez 1 Débit d'entretien, sinon la carte ne peut pas attaquer ce tour.                                                    |
| **Hub**                   | Vos autres composants ont +1 attaque.                                                                                                              |
| **Point unique**          | Quand cette carte est détruite, vos autres composants subissent 1 dégât.                                                                           |
| **Garde**                 | Doit être attaqué avant vos autres composants et votre SI.                                                                                         |
| **Quotas**                | Ne peut pas être attaqué plus de 2 fois par tour.                                                                                                  |
| **Connecteur (N)**        | Quand la carte est posée, piochez N cartes.                                                                                                        |
| **Diffusion**             | Quand elle attaque un composant, inflige aussi 1 dégât à 2 autres composants adverses au plus.                                                     |
| **Réactif**               | Une fois par tour, quand un de vos composants est attaqué, inflige 1 dégât à l'attaquant.                                                          |
| **File durable**          | Une fois par partie, quand un de vos composants est détruit, il revient dans votre main.                                                           |
| **Supervision**           | Au début de votre tour, regardez la carte du dessus de la pioche adverse.                                                                          |
| **Migration**             | Une fois, remplacez cette carte par un composant API ou EDA de votre main, qui coûte alors 2 de moins.                                             |
| **Autonome**              | N'attaque pas sur ordre : au début de votre tour, il attaque une cible valide tirée au hasard.                                                     |
| **Orchestration**         | Vous choisissez la cible de vos composants Autonomes.                                                                                              |
| **Outillage**             | Au début de votre tour, choisissez un de vos composants non IA : vos agents gagnent sa capacité jusqu'à la fin du tour.                            |
| **Délégation**            | Une fois par tour, un autre de vos agents peut attaquer une seconde fois.                                                                          |
| **Contexte**              | +1 attaque par tranche de 2 cartes dans votre défausse (+3 au plus).                                                                               |
| **Garde-fous**            | Vos composants IA sont immunisés contre Hallucination et Prompt injection.                                                                         |
| **Asynchrone**            | Vos composants IA sont immunisés contre Timeout et Boucle d'agents.                                                                                |
| **Cache sémantique**      | Votre premier sort IA de chaque tour ne coûte rien.                                                                                                |
| **Routage multi-modèles** | Une fois par tour, renvoyez un de vos composants IA dans votre main et posez gratuitement un composant IA de votre main de coût inférieur ou égal. |

« Agent » désigne les composants IA qui ont la capacité Autonome.

## Le bot

Ses niveaux suivent les époques : **Batch de nuit** (fichiers), **Architecte ESB**, **Architecte EDA**, puis le boss
**Agent autonome**. Mode « bot contre bot » à regarder, qui sert aussi à équilibrer les cartes.
