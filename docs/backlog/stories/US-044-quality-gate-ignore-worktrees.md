# US-044 — Le quality gate ignore les worktrees de l'app Claude Desktop

- **Epic** : EPIC-00
- **Statut** : Faite
- **Priorité** : Must
- **Taille** : XS
- **Branche** : `us-044-quality-gate-ignore-worktrees`

## Récit

En tant que **développeur**, je veux **que `npm run check` ne parcoure pas les worktrees Git créés par l'app Claude
Desktop dans le dossier du projet** afin de **ne pas voir le quality gate échouer sur une copie du dépôt qui n'est
pas la mienne**.

## Contexte

Constat du 2026-10-19 : `prettier --check .` échoue sur neuf fichiers de
`.claude/worktrees/frosty-elgamal-e2735d/apps/api/drizzle/meta/*.json`. L'app Claude Desktop crée ses worktrees
Git sous `.claude/worktrees/` (ignorés de Git par `.git/info/exclude`, un réglage local au poste). Or
`.prettierignore` exclut `apps/api/drizzle` à la racine seulement, pas ses copies dans un worktree. ESLint lint lui
aussi toute la copie (`eslint .` passe sur un fichier du worktree sans l'ignorer), ce qui double son temps et
peut faire remonter les erreurs d'une autre branche. Vitest (`include` ancrés à la racine), `ng test`
(`apps/web/src`), Playwright (`testDir: 'e2e'`) et le typecheck (`include: ["src"]`) ne sont pas concernés.

## Critères d'acceptation

- [x] **Étant donné** un worktree présent sous `.claude/worktrees/`, **quand** `prettier --check .` s'exécute,
      **alors** aucun de ses fichiers n'est vérifié.
- [x] **Étant donné** le même worktree, **quand** `eslint .` s'exécute, **alors** ses fichiers sont ignorés (mesuré avec `eslint --debug .` :
      149 fichiers trouvés avec l'ignore, 286 sans).
- [x] **Étant donné** le même worktree, **alors** Vitest, `ng test`, Playwright et le typecheck ne le parcourent
      pas non plus (vérifié : `npx vitest list` ne liste aucun test sous `.claude/`).
- [x] **Étant donné** un clone sans `.git/info/exclude`, **alors** `.claude/worktrees/` est ignoré de Git par
      `.gitignore`, pour que ces copies n'apparaissent jamais dans un commit.
- [x] `npm run check` passe alors que `.claude/worktrees/frosty-elgamal-e2735d` est présent.

## Notes

- `.claude/launch.json` est versionné (configuration des serveurs de prévisualisation) : seul le sous-dossier
  `worktrees/` est ignoré, pas tout `.claude/`.
- Le worktree `frosty-elgamal-e2735d` appartient à une autre session : il sert de preuve, il n'est pas supprimé.

## Journal

- 2026-10-19 — création, après l'échec de `prettier --check .` sur un worktree de l'app.
- 2026-10-19 — livrée : Prettier, ESLint et Git ignorent .claude/worktrees/ ; check vert avec le worktree frosty-elgamal-e2735d présent (ESLint : 149 fichiers au lieu de 286)
