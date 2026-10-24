import { randomUUID } from 'node:crypto';
import {
  appliquer,
  choisirActionStagiaire,
  creerPartie,
  DECKS_PRETES,
  type EtatPartie,
  vueDe,
} from '@hipmaster/domain';
import postgres from 'postgres';
import { ouvrirBase } from './db/index.ts';

// Mesure des requêtes de l'API (US-057) : `DATABASE_URL=… node apps/api/src/mesurer-requetes.ts`. Crée une base
// jetable sur le serveur de DATABASE_URL, la remplit d'un volume réaliste (un joueur assidu et ses 400 duels parmi
// 6 000, 1 000 parties contre le bot, 20 000 récompenses), passe chaque requête au crible d'`EXPLAIN ANALYZE`
// puis supprime la base. Les requêtes reprennent le SQL de l'API ; elles sont à tenir à jour avec lui.

const url = process.env['DATABASE_URL'];
if (!url) throw new Error('DATABASE_URL manque : la mesure se fait sur PostgreSQL.');

/** Une vraie partie de 40 coups entre deux bots : l'état d'un duel avancé, tel que l'API le garde. */
function etatRealiste(): EtatPartie {
  const [a, b] = DECKS_PRETES;
  if (!a || !b) throw new Error('Il faut deux decks prêts.');
  let etat = creerPartie({ j1: a.cartes, j2: b.cartes }, [1, 2, 3, 4, 5, 6, 7, 8]);
  for (let coup = 0; coup < 40 && !etat.issue; coup++) {
    const applique = appliquer(etat, choisirActionStagiaire(vueDe(etat, etat.actif)));
    if (!applique.ok) break;
    etat = applique.etat;
  }
  return { ...etat, issue: null };
}

const serveur = postgres(url, { max: 1, onnotice: () => undefined });
const nom = `hipmaster_mesure_${randomUUID().replaceAll('-', '')}`;
await serveur.unsafe(`create database ${nom}`);
const urlBase = new URL(url);
urlBase.pathname = `/${nom}`;
const { fermer } = await ouvrirBase({ url: urlBase.toString(), locale: 'memory://' });
await fermer();
const sql = postgres(urlBase.toString(), { max: 1, onnotice: () => undefined });

try {
  const etat = etatRealiste();
  const P = '00000000-0000-4000-8000-000000000001';
  const ADVERSAIRE = '00000000-0000-4000-8000-000000000002';
  await sql`insert into joueurs (id, pseudo, empreinte_code) values (${P}, 'Assidu', 'p'), (${ADVERSAIRE}, 'Rival', 'r')`;
  await sql`insert into joueurs (pseudo, empreinte_code) select 'J' || i, 'e' || i from generate_series(1, 298) i`;
  await sql`insert into sessions (empreinte_jeton, joueur_id) select 's' || i || '-' || id, id from joueurs, generate_series(1, 3) i`;
  // 6 000 duels : 400 du joueur assidu (3 en cours, 2 défis en attente), le reste entre les autres joueurs.
  await sql`
    with autres as (select array_agg(id) ids from joueurs where id not in (${P}, ${ADVERSAIRE}))
    insert into duels (statut, version, createur_id, deck_createur, adversaire_id, deck_adversaire, etat, cree_le, maj_le)
    select case when i <= 3 then 'en-cours' else 'termine' end, 30,
      case when i % 2 = 0 then ${P}::uuid else ids[1 + i % 298] end, 'reseau',
      case when i % 2 = 0 then ids[1 + i % 298] else ${P}::uuid end, 'donnees',
      ${sql.json(etat as never)}, now() - (i || ' hours')::interval, now() - (i || ' hours')::interval
    from generate_series(1, 400) i, autres`;
  await sql`
    with autres as (select array_agg(id) ids from joueurs where id not in (${P}, ${ADVERSAIRE}))
    insert into duels (statut, version, createur_id, deck_createur, adversaire_id, deck_adversaire, etat, cree_le, maj_le)
    select 'termine', 30, ids[1 + i % 298], 'reseau', ids[1 + (i * 7) % 298], 'donnees',
      ${sql.json(etat as never)}, now() - (i || ' minutes')::interval, now() - (i || ' minutes')::interval
    from generate_series(1, 5600) i, autres`;
  await sql`insert into duels (statut, createur_id, deck_createur, ouvert, cree_le)
    select 'attente', id, 'reseau', true, now() - interval '1 hour' from joueurs limit 20`;
  await sql`insert into duels (statut, createur_id, deck_createur) values ('attente', ${P}, 'reseau'), ('attente', ${P}, 'reseau')`;
  await sql`insert into recompenses (partie_id, joueur_id, booster, accordee_le)
    select gen_random_uuid(), ids[1 + i % 300], true, now() - (i || ' minutes')::interval
    from generate_series(1, 20000) i, (select array_agg(id) ids from joueurs) j`;
  await sql`insert into parties (joueur_id, session, deck, deck_bot, niveau, etat)
    select s.joueur_id, s.empreinte_jeton, 'reseau', 'donnees', 'stagiaire', ${sql.json(etat as never)}
    from sessions s limit 900`;
  await sql`insert into parties (deck, deck_bot, niveau, etat)
    select 'reseau', 'donnees', 'stagiaire', ${sql.json(etat as never)} from generate_series(1, 100)`;
  await sql`insert into collection (joueur_id, numero, exemplaires) select id, n, 1 from joueurs, generate_series(1, 60) n`;
  await sql`vacuum analyze`;
  const [{ taille } = { taille: '' }] =
    await sql`select pg_size_pretty(pg_total_relation_size('duels')) taille`;
  const [session] = await sql`select empreinte_jeton from sessions where joueur_id = ${P} limit 1`;
  const [duel] =
    await sql`select id from duels where createur_id = ${P} and statut = 'en-cours' limit 1`;
  const jeton = String(session?.['empreinte_jeton']);
  const idDuel = String(duel?.['id']);
  console.log(
    `Base de mesure : ${taille} de duels (état de ${JSON.stringify(etat).length} octets)\n`,
  );

  /** Une requête, ses paramètres ; `ecrit` : à mesurer dans une transaction annulée. */
  const requetes: { nom: string; texte: string; parametres: (string | number)[]; ecrit?: true }[] =
    [
      {
        nom: 'session : joueur du jeton',
        texte: `select j.id, j.pseudo, s.utilisee_le from sessions s join joueurs j on s.joueur_id = j.id
          where s.empreinte_jeton = $1 and s.utilisee_le > now() - interval '90 days'`,
        parametres: [jeton],
      },
      {
        nom: 'mes duels : duels en retard',
        texte: `select * from duels where statut = 'en-cours' and (createur_id = $1 or adversaire_id = $1)
          and maj_le < now() - interval '72 hours'`,
        parametres: [P],
      },
      {
        nom: 'mes duels : liste (avant US-057, tous les duels)',
        texte: `select d.id, d.statut, d.createur_id, c.pseudo, a.pseudo, d.etat->>'actif', d.etat->>'tour',
          d.etat->'issue'->>'gagnant', d.etat->'issue'->>'raison', d.maj_le from duels d
          left join joueurs c on c.id = d.createur_id left join joueurs a on a.id = d.adversaire_id
          where d.createur_id = $1 or d.adversaire_id = $1 order by d.maj_le desc`,
        parametres: [P],
      },
      ...[
        { nom: 'pas terminés', filtre: `statut <> 'termine'`, limite: 200 },
        { nom: '20 derniers terminés', filtre: `statut = 'termine'`, limite: 20 },
      ].map(({ nom, filtre, limite }) => ({
        nom: `mes duels (US-057) : ${nom}`,
        // Les duels retenus sont choisis sans leur état ; l'état n'est décompressé que pour eux.
        texte: `select d.id, d.statut, d.createur_id, c.pseudo, a.pseudo, d.etat->>'actif', d.etat->>'tour',
          d.etat->'issue'->>'gagnant', d.etat->'issue'->>'raison', d.maj_le from duels d
          left join joueurs c on c.id = d.createur_id left join joueurs a on a.id = d.adversaire_id
          where d.id in (select id from duels where (createur_id = $1 or adversaire_id = $1) and ${filtre}
            order by maj_le desc limit ${limite})
          order by d.maj_le desc`,
        parametres: [P],
      })),
      {
        nom: 'duel : lecture complète',
        texte: `select * from duels where id = $1`,
        parametres: [idDuel],
      },
      {
        nom: 'duel : lecture de la version (US-057)',
        texte: `select id, statut, version, createur_id, adversaire_id, cree_le, maj_le from duels where id = $1`,
        parametres: [idDuel],
      },
      {
        nom: 'duel : adversaire déjà affronté ce jour',
        texte: `select id from duels where id <> $1 and cree_le >= now() - interval '1 day' and cree_le <= now()
          and ((createur_id = $2 and adversaire_id = $3) or (createur_id = $3 and adversaire_id = $2)) limit 1`,
        parametres: [idDuel, P, ADVERSAIRE],
      },
      {
        nom: 'hasard : déjà dans la file',
        texte: `select * from duels where createur_id = $1 and statut = 'attente' and ouvert
          and cree_le > now() - interval '7 days' limit 1`,
        parametres: [P],
      },
      {
        nom: 'hasard : dernier adversaire',
        texte: `select createur_id, adversaire_id from duels where adversaire_id is not null
          and (createur_id = $1 or adversaire_id = $1) order by maj_le desc limit 1`,
        parametres: [P],
      },
      {
        nom: 'hasard : file des duels ouverts',
        texte: `select * from duels where statut = 'attente' and ouvert and createur_id <> $1
          and cree_le > now() - interval '7 days' order by cree_le limit 10 for update skip locked`,
        parametres: [P],
      },
      {
        nom: 'récompense : victoires du jour',
        texte: `select count(*) from recompenses where joueur_id = $1 and booster and accordee_le >= current_date`,
        parametres: [P],
      },
      {
        nom: 'collection du joueur',
        texte: `select numero, exemplaires from collection where joueur_id = $1 order by numero`,
        parametres: [P],
      },
      {
        nom: 'fermer ses autres sessions',
        texte: `delete from sessions where joueur_id = $1 and empreinte_jeton <> $2`,
        parametres: [P, jeton],
        ecrit: true,
      },
      {
        nom: 'fermer sa session (cascade sur ses parties)',
        texte: `delete from sessions where empreinte_jeton = $1`,
        parametres: [jeton],
        ecrit: true,
      },
      {
        nom: 'supprimer son compte (cascades)',
        texte: `delete from joueurs where id = $1`,
        parametres: [P],
        ecrit: true,
      },
      {
        nom: 'purge : défis expirés',
        texte: `delete from duels where statut = 'attente' and cree_le < now() - interval '7 days'`,
        parametres: [],
        ecrit: true,
      },
    ];

  interface Noeud {
    'Node Type': string;
    'Relation Name'?: string;
    'Index Name'?: string;
    Plans?: Noeud[];
  }
  const parcours = (noeud: Noeud): string[] => [
    ...(noeud['Relation Name']
      ? [`${noeud['Node Type']} ${noeud['Index Name'] ?? noeud['Relation Name']}`]
      : []),
    ...(noeud.Plans ?? []).flatMap(parcours),
  ];

  for (const requete of requetes) {
    // Deux passages : le second, cache chaud, est celui qu'on retient.
    let resultat: postgres.Row | undefined;
    for (let passage = 0; passage < 2; passage++) {
      await sql.unsafe('begin');
      [resultat] = await sql.unsafe(
        `explain (analyze, buffers, format json) ${requete.texte}`,
        requete.parametres,
      );
      await sql.unsafe('rollback');
    }
    const [plan] = resultat?.['QUERY PLAN'] as [
      {
        Plan: Noeud & { 'Shared Hit Blocks': number; 'Shared Read Blocks': number };
        'Execution Time': number;
        Triggers?: { Relation: string; Time: number }[];
      },
    ];
    const blocs = plan.Plan['Shared Hit Blocks'] + plan.Plan['Shared Read Blocks'];
    const declencheurs = (plan.Triggers ?? []).reduce((total, d) => total + d.Time, 0);
    console.log(
      `${requete.nom.padEnd(48)} ${plan['Execution Time'].toFixed(2).padStart(8)} ms ` +
        `${String(blocs).padStart(6)} blocs` +
        (declencheurs ? ` (dont cascades ${declencheurs.toFixed(2)} ms)` : '') +
        `\n    ${parcours(plan.Plan).join(', ')}`,
    );
  }
} finally {
  await sql.end();
  await serveur.unsafe(`drop database if exists ${nom} with (force)`);
  await serveur.end();
}
