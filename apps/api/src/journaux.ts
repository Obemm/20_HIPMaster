import { DrizzleQueryError } from 'drizzle-orm';
import { type DestinationStream, type Logger, pino } from 'pino';

/** Journaux de l'API (US-046) : des lignes JSON au format de Cloud Logging, en production comme en développement. */

export const NIVEAUX_JOURNAL = [
  'fatal',
  'error',
  'warn',
  'info',
  'debug',
  'trace',
  'silent',
] as const;
export type NiveauJournal = (typeof NIVEAUX_JOURNAL)[number];

/** Sévérité Cloud Logging de chaque niveau pino : sans elle, tout arrive en « DEFAULT ». */
const SEVERITES: Record<string, string> = {
  trace: 'DEBUG',
  debug: 'DEBUG',
  info: 'INFO',
  warn: 'WARNING',
  error: 'ERROR',
  fatal: 'CRITICAL',
};

/**
 * Le message d'une erreur, sans les paramètres qu'une requête SQL en échec recopie dans le sien : une erreur de
 * Drizzle cite toutes les valeurs de la requête (pseudo, état de partie…).
 */
export function messageErreur(erreur: unknown): string {
  if (erreur instanceof DrizzleQueryError) return `Failed query: ${erreur.query}`;
  return erreur instanceof Error ? erreur.message : String(erreur);
}

/** La pile d'appels d'une erreur, débarrassée des mêmes paramètres (sa première ligne reprend le message). */
function pileErreur(erreur: Error): string | undefined {
  // Remplacement par une fonction : la requête contient des `$1`, que `replace` lirait comme des motifs.
  return erreur.stack?.replace(erreur.message, () => messageErreur(erreur));
}

interface ErreurJournal {
  type: string;
  message: string;
  code?: string;
  cause?: ErreurJournal;
}

/**
 * Ce qu'une erreur laisse dans les journaux : son type, son message, son code et sa cause, jamais ses autres propriétés
 * (le détail d'une erreur PostgreSQL ou les paramètres d'une requête contiennent des données de joueurs).
 */
function serialiserErreur(erreur: unknown, profondeur = 0): unknown {
  if (!(erreur instanceof Error)) return erreur;
  const { code } = erreur as { code?: unknown };
  const cause = erreur.cause instanceof Error && profondeur < 3 ? erreur.cause : undefined;
  const serialisee: ErreurJournal = {
    type: erreur.constructor.name || erreur.name,
    message: messageErreur(erreur),
    ...(typeof code === 'string' && { code }),
    ...(cause && { cause: serialiserErreur(cause, profondeur + 1) as ErreurJournal }),
  };
  return serialisee;
}

/** Error Reporting reconnaît une erreur à la pile d'appels rangée dans `stack_trace` (US-051). */
function ajouterPile(objet: Record<string, unknown>): Record<string, unknown> {
  const erreur = objet['err'];
  return erreur instanceof Error ? { ...objet, stack_trace: pileErreur(erreur) } : objet;
}

/**
 * Le journal de l'API : `severity` et `message` comme les attend Cloud Logging, heure ISO, niveau réglable
 * (`LOG_LEVEL`). Les requêtes n'y laissent ni en-têtes ni corps (sérialiseurs de Fastify).
 */
export function creerJournal(options: { niveau: NiveauJournal; flux?: DestinationStream }): Logger {
  return pino(
    {
      level: options.niveau,
      messageKey: 'message',
      base: null,
      timestamp: pino.stdTimeFunctions.isoTime,
      formatters: {
        level: (niveau) => ({ severity: SEVERITES[niveau] ?? 'DEFAULT' }),
        log: ajouterPile,
      },
      serializers: { err: serialiserErreur },
    },
    options.flux,
  );
}

/** `X-Cloud-Trace-Context: TRACE_ID/SPAN_ID;o=1`, posé par Cloud Run sur chaque requête. */
const TRACE_CLOUD = /^([\da-f]{32})(?:\/(\d{1,20}))?(?:;o=([01]))?/i;

/**
 * Champs qui relient un journal à la trace de sa requête dans Cloud Logging ; rien sans projet Google Cloud ni
 * en-tête valide (développement, tests).
 */
export function champsTrace(
  entete: string | string[] | undefined,
  projet: string | null,
): Record<string, string | boolean> {
  const valeur = Array.isArray(entete) ? entete[0] : entete;
  const trouve = projet && valeur ? TRACE_CLOUD.exec(valeur) : null;
  if (!trouve) return {};
  const [, trace, span, echantillon] = trouve;
  return {
    'logging.googleapis.com/trace': `projects/${projet}/traces/${trace}`,
    // Cloud Logging attend l'identifiant de span en hexadécimal sur 16 caractères ; l'en-tête le donne en décimal.
    ...(span && {
      'logging.googleapis.com/spanId': BigInt(span).toString(16).padStart(16, '0'),
    }),
    ...(echantillon && { 'logging.googleapis.com/trace_sampled': echantillon === '1' }),
  };
}
