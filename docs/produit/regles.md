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
- Le joueur qui joue **en second** reçoit **1 Débit de plus à son premier tour seulement** : 2 au lieu de 1, puis 2,
  3, 4… comme l'autre joueur. Commencer ne décide ainsi pas de la partie
  ([ADR 0026](../decisions/0026-debit-du-second-joueur.md)).
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
   - **Rien n'attaque tout seul** : à chaque tour, pour chaque composant qui doit attaquer, vous choisissez
     l'**attaquant** (un de vos composants) puis sa **cible** (un composant adverse ou le SI adverse). Poser des
     cartes ne suffit pas : un tour où vous ne faites que poser ne fait aucun dégât à l'adversaire. Seuls les agents
     **Autonomes** attaquent sans ordre (voir plus bas).
   - Contre un **composant** : chacun inflige son attaque à l'autre (riposte). À 0 PV, un composant est détruit.
   - Contre le **SI** : le SLA adverse perd l'attaque du composant, sans riposte.
   - Tant que l'adversaire a un composant avec **Garde**, il faut l'attaquer en premier.
   - Attaquer avant ou après avoir posé des cartes : c'est vous qui choisissez l'ordre.
5. **Finir le tour** : les composants qui n'ont pas attaqué perdent leur attaque de ce tour (elle ne se reporte pas).

Les dégâts restent d'un tour à l'autre. Tout le hasard (pioche, cibles au hasard) est tiré par le serveur (ADR 0004).

## Résoudre un combat

Une attaque se résout toujours dans cet ordre :

1. **Vérifier que l'attaque est permise.** L'attaquant n'a pas été posé ce tour, n'a pas déjà attaqué, a une attaque
   supérieure à 0 et n'est pas bloqué (entretien Sur site impayé, immobilisation, Batch). La cible respecte Garde et
   Quotas.
2. **Calculer les forces.** La force d'un composant est son attaque imprimée, plus +1 par **Hub** allié en jeu (le
   Hub ne se compte pas lui-même), plus les bonus permanents (Renfort, Contexte…). La riposte du défenseur se calcule
   de la même façon, avec les Hubs de **son** camp.
3. **Échanger les coups, en même temps.** Le défenseur perd la force de l'attaquant, l'attaquant perd la force du
   défenseur. Le défenseur riposte même s'il tombe à 0 PV : les deux peuvent être détruits ensemble.
4. **Effets de l'attaque.** Diffusion de l'attaquant, puis un Réactif du défenseur encore en vie (+1 dégât à
   l'attaquant).
5. **Destructions.** Tout composant à 0 PV est détruit (Point unique et File durable se déclenchent alors).

Contre le SI, seules les étapes 1 et 2 comptent : le SLA perd la force de l'attaquant, sans riposte ni Réactif.

### Exemples

**Échange qui détruit les deux cartes.** API REST (attaque 3, PV 2) attaque Adaptateur JDBC (attaque 2, PV 3).
JDBC subit 3 dégâts : 3 − 3 = 0, il est détruit. API REST subit la riposte de 2 : 2 − 2 = 0, elle est détruite aussi.

**Attaque du SI avec un Hub.** Vous avez Universal Messaging (attaque 2) et webMethods Integration Server 10.15
(Hub) en jeu, posés aux tours précédents. Universal Messaging attaque le SI adverse avec une force de 2 + 1 = 3 :
le SLA adverse perd 3. webMethods IS (attaque 4) attaque ensuite le SI : il ne profite pas de son propre Hub, le SLA
perd encore 4. Total du tour : 7 SLA. Si vous vous contentez de poser des cartes, ce tour ne fait aucun dégât.

**Garde, et dégâts qui restent.** L'adversaire a Adaptateur SAP (Garde, attaque 3, PV 5) : vous ne pouvez viser ni
son SI ni ses autres composants. SOAP / WSDL (attaque 3, PV 4) attaque SAP : SAP passe à 2 PV, SOAP passe à 1 PV.
Au tour suivant, SAP a toujours 2 PV : une attaque de 2 suffit à le détruire et à rouvrir l'accès au SI.

**Réactif.** L'adversaire a Topic (Réactif, attaque 1, PV 2) et API REST (attaque 3, PV 2). SOAP / WSDL (attaque 3,
PV 4) attaque API REST : API REST est détruite, SOAP subit 3 de riposte puis 1 de Réactif (Topic est en vie) et
tombe à 0. Pour garder SOAP, il valait mieux détruire Topic d'abord.

**Évolution.** webMethods IS 10.15, posé au tour précédent, évolue en webMethods.io : la nouvelle carte arrive avec
ses 7 PV pleins et peut attaquer tout de suite, puisque webMethods IS le pouvait.

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

## Effets propres des composants (US-019)

- **Pioche ciblée** (webMethods Designer, Apigee API Hub, Solace Event Portal) : la première carte de la famille voulue
  dans la pioche passe en main ; s'il n'y en a pas, rien ne se passe.
- **Renfort** (OpenAPI, AsyncAPI) : la carte se pose sur un de vos composants de la famille (+1 attaque, permanent) ;
  sans composant de la famille en jeu, elle se pose sans effet.
- **Cron** : une fois par tour, un de vos composants Batch peut attaquer même s'il a attaqué au tour précédent.
- **Base vectorielle** : vos agents en jeu gagnent 1 PV à sa pose, comme ceux posés ensuite tant qu'elle est en jeu.
- Un composant dont les capacités sont suspendues (Certificat expiré, Contexte saturé) perd aussi son effet propre
  permanent.

## Capacités IA et Migration (US-020)

- **Autonome** : sans Orchestration, un agent n'attaque jamais sur ordre ; au début de votre tour, il attaque une
  cible valide tirée au hasard (Garde et Quotas respectés). Avec **Orchestration**, vous le faites attaquer vous-même.
- **Délégation** : une fois par tour, un agent qui a déjà attaqué attaque une seconde fois (un agent autonome le fait
  seul, au hasard) ; Solace Agent Mesh donne cet effet à vos agents.
- **Outillage** (action « outiller », une fois par tour) : vos agents empruntent les capacités d'un de vos
  composants non IA jusqu'à la fin du tour ; Solace Agent Mesh donne aussi cet effet.
- **Routage multi-modèles** (action « router », une fois par tour) : un composant IA (autre que celui qui route)
  revient en main, et un composant IA de la main, de coût inférieur ou égal, prend sa place gratuitement ; il ne peut
  pas attaquer ce tour.
- **Migration** (action « migrer ») : SFTP est remplacé par un composant API ou EDA de la main, qui coûte 2 de moins ;
  SFTP part à la défausse et la nouvelle carte ne peut pas attaquer ce tour.
- **Cache sémantique** : votre premier sort IA du tour ne coûte rien.

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

Quatre niveaux, du plus simple au plus fort : **Stagiaire** (facile : il joue comme un débutant), **Batch de nuit**
(moyen), **Architecte ESB** (difficile) et le boss **Agent autonome** (expert). Un niveau **Architecte EDA** reste
possible. Mode « bot contre bot » à regarder, qui sert aussi à équilibrer les cartes ([cartes-set-1.md](cartes-set-1.md)).
