# US-017 — Illustrations des 71 cartes du set 1

- **Epic** : EPIC-05
- **Statut** : En cours
- **Priorité** : Should
- **Taille** : L
- **Branche** : `us-017-illustrations-set-1`

## Récit

En tant que **joueur de l'équipe d'intégration**, je veux **que chaque carte du set 1 ait son illustration** afin de
**reconnaître une carte d'un coup d'œil et d'avoir envie de la collectionner**.

## Critères d'acceptation

- [ ] Les 71 cartes ont une illustration conforme à la direction artistique (US-016), relue par le porteur du projet.
- [ ] Chacune a un texte alternatif et sa provenance (outil, date, consigne) dans `packages/illustrations/set-1.json`.
- [ ] Un test vérifie que **toutes** les cartes du set 1 ont une illustration de moins de 100 Ko (indicateur de
      réussite d'EPIC-05).
- [ ] Les originaux sont archivés hors du dépôt (ADR 0015).
- [ ] Les captures du catalogue, sur mobile et sur bureau, en thème clair et sombre, sont jointes à la PR.

## Notes

- Dépend d'US-015 (chaîne d'images) et d'US-016 (outil et style).
- Si le générateur a une API (Recraft), un script peut produire les originaux à partir des consignes de
  `set-1.json` ; la clé d'API reste dans `.env`, jamais dans le dépôt.

## Journal

- 2026-10-18 — création, au découpage d'EPIC-05.
- 2026-10-24 — essai sur 3 cartes (FTP, Apigee API Gateway, Solace Agent Mesh) : images générées par Gemini (application
  web, compte du porteur du projet) pilotée depuis Chrome, avec les prompts de `docs/produit/prompts-illustrations-gemini.md` ;
  Apigee sert de référence de style aux deux autres, dans la même conversation. Originaux JPEG 2400 × 1792 archivés hors
  du dépôt (ADR 0015), convertis en PNG puis déclinés par `npm run illustrations` (49 à 62 Ko en 640 px). Les 68 autres
  cartes gardent leur illustration provisoire en attendant l'avis du porteur sur l'essai.
- 2026-10-24 — avis du porteur sur l'essai : images **trop ressemblantes** (toujours un robot de face dans une arche,
  avec un halo ; seule la couleur changeait). Nouvelle consigne : l'image de référence ne transmet que le rendu, chaque
  carte reçoit une créature à elle. SFTP refait ainsi (coursier blindé à carapace de cadenas), devenu la référence de
  rendu. Liste des 71 créatures, prompts et direction artistique réécrits, soumis au porteur avant la génération.
- 2026-10-24 — famille Fichiers & Batch (1 à 8) : FTP refait (pélican facteur), 3 à 8 générées avec SFTP comme
  référence de rendu. Le premier paquet reprenait le décor de SFTP (sol de câbles, bandes perforées) : à la demande du
  porteur, les prompts imposent un décor propre à chaque carte et 3 à 8 ont été refaites ; quatre ont reçu une phrase
  corrective (texte sur le document, décor trop proche d'une autre carte), consignée dans `set-1.json`. Les
  originaux remplacés sont gardés hors du dépôt (`*-essai-*.jpeg`).
- 2026-10-24 — famille Messagerie & ESB (9 à 17) : neuf créatures, neuf décors ; six images ont reçu une phrase de
  décor ou de lisibilité (pieuvre de la 9), consignée dans `set-1.json`. Gemini a refusé une fois la 17 sans raison,
  la relance avec un décor a fonctionné.
- 2026-10-24 — famille API (18 à 25) : Apigee API Gateway refait en griffon gardien (l'essai robot est écarté,
  original gardé) ; chaque prompt reçoit d'emblée une phrase de décor, consignée dans `set-1.json`.
- 2026-10-24 — famille iPaaS (26 à 30) : webMethods.io générée avec deux références (le rendu de SFTP et la pieuvre
  de la 9, dont elle est l'évolution) ; matières variées (plumes, pierre, ailes d'insecte) et non plus toutes
  mécaniques. La limite quotidienne d'images de Gemini est tombée sur la 38 (AsyncAPI).
