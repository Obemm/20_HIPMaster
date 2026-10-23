import { parseArgs } from 'node:util';
import { z } from 'zod';
import type { Base } from '../db/index.ts';
import {
  creerInvitation,
  finDuJour,
  LIBELLE_MAX,
  lienInvitation,
  listerInvitations,
  type ResumeInvitation,
  revoquerInvitation,
  SITE_PAR_DEFAUT,
  statutInvitation,
  UTILISATIONS_MAX,
} from './invitations.ts';

/**
 * La commande des invitations (US-048, ADR 0027), sans ses entrées-sorties : `invitation.ts` la lance. Elle crée une
 * invitation et montre son code une seule fois, liste les invitations, ou en révoque une.
 */

export const AIDE = `Usage :
  npm run invitation -- --libelle "Équipe intégration" --utilisations 20 [--expire AAAA-MM-JJ | --jours N] [--site URL]
  npm run invitation -- --lister
  npm run invitation -- --revoquer <identifiant>

Une invitation expire à la fin du jour --expire (minuit UTC), ou --jours jours après sa création (30 par défaut).
Son code n'est affiché qu'à sa création : la base n'en garde que l'empreinte.`;

const JOUR_MS = 24 * 60 * 60 * 1000;

export type Commande =
  | { action: 'creer'; libelle: string; utilisations: number; expireLe: Date; site: string }
  | { action: 'lister' }
  | { action: 'revoquer'; id: string }
  | { action: 'aide' };

/** Arguments invalides : le message dit quoi corriger. */
export class ErreurArguments extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ErreurArguments';
  }
}

const LIBELLE = `--libelle : pour qui, ou pour quelle campagne (${LIBELLE_MAX} caractères au plus)`;
const UTILISATIONS = `--utilisations : le nombre de comptes que le code peut créer, de 1 à ${UTILISATIONS_MAX}`;
const JOURS = '--jours : de 1 à 365';

const schemaCreation = z
  .object({
    libelle: z.string({ error: LIBELLE }).trim().min(1, LIBELLE).max(LIBELLE_MAX, LIBELLE),
    utilisations: z.coerce
      .number({ error: UTILISATIONS })
      .int(UTILISATIONS)
      .min(1, UTILISATIONS)
      .max(UTILISATIONS_MAX, UTILISATIONS),
    expire: z.iso.date({ error: '--expire : une date AAAA-MM-JJ' }).optional(),
    jours: z.coerce.number({ error: JOURS }).int(JOURS).min(1, JOURS).max(365, JOURS).optional(),
    site: z
      .url({ protocol: /^https?$/, error: '--site : une adresse http ou https' })
      .default(SITE_PAR_DEFAUT),
  })
  .refine((valeurs) => valeurs.expire === undefined || valeurs.jours === undefined, {
    error: '--expire et --jours ne vont pas ensemble',
  });

/** Les refus de `parseArgs` (option inconnue, valeur manquante, argument en trop), en français. */
function traduireErreurArguments(erreur: unknown): string {
  const { code, message } = erreur as { code?: string; message?: string };
  const cite = /'([^' ]+)/.exec(message ?? '')?.[1] ?? '';
  switch (code) {
    case 'ERR_PARSE_ARGS_UNKNOWN_OPTION':
      return `Option inconnue : ${cite}`;
    case 'ERR_PARSE_ARGS_INVALID_OPTION_VALUE':
      return message?.includes('does not take an argument')
        ? `L’option ${cite} ne prend pas de valeur.`
        : `L’option ${cite} attend une valeur.`;
    case 'ERR_PARSE_ARGS_UNEXPECTED_POSITIONAL':
      return `Argument inattendu : ${cite}`;
    default:
      return `Arguments invalides : ${message ?? String(erreur)}`;
  }
}

/** Lit les arguments de la commande ; lève une `ErreurArguments` qui dit quoi corriger. */
export function lireArguments(argv: string[], maintenant = new Date()): Commande {
  let lus;
  try {
    lus = parseArgs({
      args: argv,
      options: {
        libelle: { type: 'string' },
        utilisations: { type: 'string' },
        expire: { type: 'string' },
        jours: { type: 'string' },
        site: { type: 'string' },
        lister: { type: 'boolean' },
        revoquer: { type: 'string' },
        aide: { type: 'boolean', short: 'h' },
      },
    }).values;
  } catch (erreur) {
    throw new ErreurArguments(traduireErreurArguments(erreur));
  }
  const { lister, revoquer, aide, ...creation } = lus;
  const autres = Object.keys(creation).length;
  if (aide) return { action: 'aide' };
  if (lister || revoquer !== undefined) {
    if (autres > 0 || (lister && revoquer !== undefined)) {
      throw new ErreurArguments('--lister et --revoquer s’emploient seuls.');
    }
    if (lister) return { action: 'lister' };
    const id = z.uuid().safeParse(revoquer);
    if (!id.success) throw new ErreurArguments('--revoquer attend l’identifiant d’une invitation.');
    return { action: 'revoquer', id: id.data };
  }
  const lue = schemaCreation.safeParse(creation);
  if (!lue.success) throw new ErreurArguments(z.prettifyError(lue.error));
  const { libelle, utilisations, expire, jours = 30, site } = lue.data;
  // --expire : valable tout le jour indiqué, jusqu'à minuit UTC.
  const expireLe = expire ? finDuJour(expire) : new Date(maintenant.getTime() + jours * JOUR_MS);
  if (expireLe <= maintenant) throw new ErreurArguments('--expire est déjà passé.');
  return { action: 'creer', libelle, utilisations, expireLe, site };
}

/** « 2027-01-01 00:00 UTC » : sans ambiguïté, quel que soit le fuseau de qui lit. */
const dateUtc = (date: Date) => `${date.toISOString().slice(0, 16).replace('T', ' ')} UTC`;

/** « expire le … », « expirée le … » ou « révoquée le … ». */
function echeance(invitation: ResumeInvitation, maintenant: Date): string {
  if (invitation.revoqueeLe) return `révoquée le ${dateUtc(invitation.revoqueeLe)}`;
  const expiree = statutInvitation(invitation, maintenant) === 'expiree';
  return `${expiree ? 'expirée le' : 'expire le'} ${dateUtc(invitation.expireLe)}`;
}

/**
 * Exécute la commande ; chaque ligne à montrer passe par `ecrire`. Renvoie faux si elle n'a rien pu faire (révocation
 * d'une invitation inconnue ou déjà expirée).
 */
export async function executer(
  commande: Exclude<Commande, { action: 'aide' }>,
  base: Base,
  cle: string,
  ecrire: (ligne: string) => void,
  maintenant = new Date(),
): Promise<boolean> {
  switch (commande.action) {
    case 'creer': {
      const { id, code } = await creerInvitation(base, commande, cle);
      ecrire(
        `Invitation « ${commande.libelle} » créée (${id}) : ${commande.utilisations} compte(s) au plus, ` +
          `jusqu’au ${dateUtc(commande.expireLe)}.`,
      );
      ecrire(`Code, affiché cette seule fois : ${code}`);
      ecrire(`Lien à envoyer : ${lienInvitation(code, commande.site)}`);
      return true;
    }
    case 'lister': {
      const liste = await listerInvitations(base);
      if (liste.length === 0) ecrire('Aucune invitation.');
      for (const invitation of liste) {
        ecrire(
          `${invitation.id}  « ${invitation.libelle} »  ${invitation.utilisations}/${invitation.utilisationsMax} ` +
            `utilisée(s), ${invitation.comptes} compte(s), ${echeance(invitation, maintenant)}`,
        );
      }
      return true;
    }
    case 'revoquer': {
      const revoquee = await revoquerInvitation(base, commande.id, maintenant);
      ecrire(
        revoquee
          ? `Invitation ${commande.id} révoquée : son code ne crée plus de compte ; les comptes déjà créés restent.`
          : `Aucune invitation en cours ne porte l’identifiant ${commande.id} (inconnue, déjà expirée ou révoquée).`,
      );
      return revoquee;
    }
  }
}
