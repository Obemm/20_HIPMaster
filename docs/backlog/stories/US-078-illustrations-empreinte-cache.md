# US-078 — Des illustrations à empreinte, gardées un an en cache

- **Epic** : EPIC-05
- **Statut** : Faite
- **Priorité** : Should
- **Taille** : S
- **Décision** : [ADR 0046](../../decisions/0046-illustrations-a-empreinte-cache-long.md), qui complète l'ADR 0015
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

- [x] **Étant donné** la chaîne des illustrations, **alors** chaque fichier produit porte une empreinte de son
      contenu dans son nom (`53-640.a1b2c3d4.avif`, 8 caractères du SHA-256), reprise par le manifeste que lit le
      front ; le script supprime les fichiers orphelins (carte retirée, ancienne empreinte).
- [x] **Étant donné** une image refaite, **alors** elle change de nom, et l'ancienne n'est plus servie.
- [x] **Étant donné** Firebase Hosting, **alors** les illustrations sont servies sous un préfixe propre
      (`/illustrations/`, l'ancien `/cartes/set-1/` disparaît), gardées un an
      (`Cache-Control: public, max-age=31536000, immutable`), et une image absente répond 404 (pas `index.html`).
- [x] **Étant donné** le service worker (ADR 0038), **alors** son groupe d'images suit le nouveau préfixe, dans les
      deux langues.
- [x] **Étant donné** le déploiement, **alors** l'étape `site` et les e2e de production vérifient l'en-tête d'une
      illustration et le 404 d'une illustration absente, en français et en anglais.

## Notes techniques

- Les 284 fichiers versionnés sont renommés par l'empreinte de leurs octets actuels (pas de réencodage : les
  originaux ne sont pas dans le dépôt), puis le manifeste est régénéré ; `npm run illustrations` produit les mêmes
  noms à partir des mêmes octets.
- Réécriture catch-all : `!/illustrations/**` → `/index.html`, exclusion documentée par Firebase Hosting.

## Journal

- 2026-10-24 — création, reportée d'US-057.
- 2026-10-25 — affinée et codée : le porteur ne voyait pas les nouvelles illustrations 53 à 71 (même nom, cache d'un
  jour et service worker). Empreinte dans le nom, préfixe `/illustrations/`, cache d'un an, 404, ADR 0046.
- 2026-10-25 — livrée : illustrations à empreinte sous /illustrations/, un an en cache, 404 si absente, service worker et contrôles du déploiement à jour (ADR 0046)
