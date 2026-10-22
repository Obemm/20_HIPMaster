# syntax=docker/dockerfile:1
# Image de l'API pour Cloud Run (US-046, ADR 0021), construite depuis la racine du dépôt, qui porte les workspaces npm :
#   docker build -t hipmaster-api .
# L'API s'exécute en TypeScript natif, et Node refuse de retirer les types d'un fichier situé sous node_modules :
# @hipmaster/domain reste donc un lien vers packages/domain, comme dans le dépôt.

FROM node:24.22.1-alpine3.24 AS dependances
WORKDIR /app
# Tous les package.json des workspaces, pour que npm ci retrouve l'arbre du package-lock.json.
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/domain/package.json packages/domain/
COPY packages/illustrations/package.json packages/illustrations/
# Les seules dépendances de production de l'API : ni Angular, ni outillage, aucun script d'installation. PGlite, pair
# optionnel de drizzle-orm, ne part qu'avec --omit=optional (77 Mo de dépendances au lieu de 43).
RUN npm ci --workspace @hipmaster/api --omit=dev --omit=optional --ignore-scripts --no-audit --no-fund

FROM node:24.22.1-alpine3.24
ENV NODE_ENV=production
# Cloud Run impose son port par PORT ; 8080 sert pour `docker run` en local.
ENV PORT=8080
WORKDIR /app
COPY --from=dependances /app/node_modules node_modules
COPY package.json ./
COPY apps/api/package.json apps/api/
COPY apps/api/drizzle apps/api/drizzle
COPY apps/api/src apps/api/src
COPY packages/domain/package.json packages/domain/
COPY packages/domain/src packages/domain/src
# Les fichiers restent à root, en lecture seule pour l'API, qui tourne sans privilèges.
USER node
EXPOSE 8080
# node directement, sans npm : il reçoit lui-même SIGTERM et s'arrête proprement (arret.ts).
# Migrations (Cloud Run Job, ADR 0023) : même image, commande `node apps/api/src/migrer.ts`.
CMD ["node", "apps/api/src/server.ts"]
