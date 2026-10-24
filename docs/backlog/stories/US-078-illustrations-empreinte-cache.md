# US-078 — Des illustrations à empreinte, gardées un an en cache

- **Epic** : EPIC-05
- **Statut** : À affiner
- **Priorité** : Should
- **Taille** : S
- **Branche** : `us-078-illustrations-empreinte`

## Récit

En tant que **joueur sur téléphone**, je veux **que les illustrations déjà vues ne soient plus jamais retéléchargées**
afin que **le catalogue et les parties s'affichent vite, même avec un réseau moyen**.

## Contexte

Reportée d'US-057 (2026-10-24), dont c'était le dernier critère : les illustrations (`apps/web/public/cartes/`,
chaîne d'US-015, ADR 0015) n'ont pas d'empreinte dans leur nom ; `firebase.json` ne peut donc les garder qu'un jour
(`max-age=86400`), et elles partagent le préfixe `/cartes/` avec une route Angular (le catalogue). La chaîne et les
fichiers changent avec US-017, en cours : la story se mène avec elle ou juste après.

## Critères d'acceptation

- [ ] **Étant donné** la chaîne des illustrations, **alors** chaque fichier produit porte une empreinte de son
      contenu dans son nom, reprise par le manifeste que lit le front.
- [ ] **Étant donné** Firebase Hosting, **alors** les illustrations sont servies sous un préfixe propre
      (`/illustrations/`) avec `Cache-Control: public, max-age=31536000, immutable`, et une image absente répond 404
      (pas `index.html`).
- [ ] **Étant donné** le service worker (ADR 0038), **alors** son groupe d'images suit le nouveau préfixe.

## Journal

- 2026-10-24 — création, reportée d'US-057.
