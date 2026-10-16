# 0010 — Combat sur plateau (Débit, SLA, capacités)

- **Date** : 2026-10-16
- **Statut** : Acceptée
- **Référence Elis** : aucune (règle de jeu, non couverte par le référentiel)

## Contexte

La vision laissait ouvert le choix de la mécanique de combat : QCM sur le contenu des cartes (WikiMasters) ou plateau
ressource / attaque / PV (Async TCG). L'univers retenu est la plateforme d'intégration d'Elis, du FTP aux agents d'IA
([univers.md](../produit/univers.md)) : les technologies ont des comportements (lenteur du batch, point unique de
l'ESB, protection de la passerelle, diffusion de l'événementiel, autonomie des agents) qu'on veut faire **ressentir**.

## Décision

Le combat se joue **sur plateau**, sur le modèle de l'Async TCG, avec un vocabulaire d'intégration :

- ressource : le **Débit** (+1 par tour, 10 au plus) ;
- cible : le **SI** adverse avec **20 points de SLA** ;
- trois types de cartes : **Composant** (attaque, PV), **Sort**, **Incident** ;
- des **capacités** qui traduisent le comportement réel de chaque technologie, et des cartes d'**Évolution** qui se
  posent à la place de la carte dont elles sont issues (FTP → SFTP → API/EDA, webMethods IS → webMethods.io…).

Les règles détaillées sont dans [regles.md](../produit/regles.md). Leur résolution reste dans `packages/domain`, en
fonctions pures avec hasard injecté, exécutées par le serveur (ADR 0004).

## Alternatives envisagées

- **QCM seul** (WikiMasters) : très pédagogique, mais ne fait pas ressentir les comportements des technologies et
  s'épuise vite une fois les réponses connues. Gardé comme futur mode « Certification ».
- **Plateau générique sans capacités thématiques** : plus simple à équilibrer, mais perd l'intérêt de l'univers.

## Conséquences

- Le moteur doit gérer des effets déclenchés (« quand il est posé », « au début de votre tour », « quand il est
  détruit ») et des immunités : un modèle d'effets est à concevoir dans `packages/domain`.
- L'équilibrage passe par des simulations « bot contre bot » rejouables à partir d'une graine.
- Les capacités à cible aléatoire (Autonome, Hallucination) sont tirées par le serveur, jamais par le client.
