import { parseArgs } from 'node:util';
import { z } from 'zod';
import type { Base } from '../db/index.ts';
import {
  beneficiairesCodeBoosters,
  BOOSTERS_PAR_CODE_MAX,
  creerCodeBoosters,
  lienCodeBoosters,
  listerCodesBoosters,
  type ResumeCodeBoosters,
  revoquerCodeBoosters,
  statutCodeBoosters,
} from './codes-boosters.ts';
import { dateUtc, ErreurArguments, traduireErreurArguments } from './commande-invitation.ts';
import { finDuJour, LIBELLE_MAX, SITE_PAR_DEFAUT, UTILISATIONS_MAX } from './invitations.ts';

export { ErreurArguments };

/**
 * La commande des codes de boosters (US-070, ADR 0045), sans ses entrées-sorties : `code-boosters.ts` la lance. Elle
 * crée un code et le montre une seule fois, liste les codes, montre qui a utilisé un code, ou en révoque un.
 */

export const AIDE = `Usage :
  npm run code-boosters -- --libelle "1re API publiée" --boosters 3 --utilisations 1 [--expire AAAA-MM-JJ | --jours N] [--site URL]
  npm run code-boosters -- --lister
  npm run code-boosters -- --beneficiaires <identifiant>
  npm run code-boosters -- --revoquer <identifiant>

Chaque joueur n'utilise un code qu'une fois ; le libellé lui est montré. Un code expire à la fin du jour --expire
(minuit UTC), ou --jours jours après sa création (30 par défaut). Il n'est affiché qu'à sa création : la base n'en
garde que l'empreinte.`;

const JOUR_MS = 24 * 60 * 60 * 1000;

export type Commande =
  | {
      action: 'creer';
      libelle: string;
      boosters: number;
      utilisations: number;
      expireLe: Date;
      site: string;
    }
  | { action: 'lister' }
  | { action: 'beneficiaires'; id: string }
  | { action: 'revoquer'; id: string }
  | { action: 'aide' };

const LIBELLE = `--libelle : la réussite récompensée, que verront les joueurs (${LIBELLE_MAX} caractères au plus)`;
const BOOSTERS = `--boosters : les boosters offerts à chaque joueur, de 1 à ${BOOSTERS_PAR_CODE_MAX}`;
const UTILISATIONS = `--utilisations : le nombre de joueurs qui peuvent utiliser le code, de 1 à ${UTILISATIONS_MAX}`;
const JOURS = '--jours : de 1 à 365';

const entier = (message: string, max: number) =>
  z.coerce.number({ error: message }).int(message).min(1, message).max(max, message);

const schemaCreation = z
  .object({
    libelle: z.string({ error: LIBELLE }).trim().min(1, LIBELLE).max(LIBELLE_MAX, LIBELLE),
    boosters: entier(BOOSTERS, BOOSTERS_PAR_CODE_MAX),
    utilisations: entier(UTILISATIONS, UTILISATIONS_MAX),
    expire: z.iso.date({ error: '--expire : une date AAAA-MM-JJ' }).optional(),
    jours: entier(JOURS, 365).optional(),
    site: z
      .url({ protocol: /^https?$/, error: '--site : une adresse http ou https' })
      .default(SITE_PAR_DEFAUT),
  })
  .refine((valeurs) => valeurs.expire === undefined || valeurs.jours === undefined, {
    error: '--expire et --jours ne vont pas ensemble',
  });

/** L'identifiant d'un code, pour --beneficiaires ou --revoquer. */
function identifiant(option: string, valeur: string | undefined): string {
  const id = z.uuid().safeParse(valeur);
  if (!id.success) throw new ErreurArguments(`${option} attend l’identifiant d’un code.`);
  return id.data;
}

/** Lit les arguments de la commande ; lève une `ErreurArguments` qui dit quoi corriger. */
export function lireArguments(argv: string[], maintenant = new Date()): Commande {
  let lus;
  try {
    lus = parseArgs({
      args: argv,
      options: {
        libelle: { type: 'string' },
        boosters: { type: 'string' },
        utilisations: { type: 'string' },
        expire: { type: 'string' },
        jours: { type: 'string' },
        site: { type: 'string' },
        lister: { type: 'boolean' },
        beneficiaires: { type: 'string' },
        revoquer: { type: 'string' },
        aide: { type: 'boolean', short: 'h' },
      },
    }).values;
  } catch (erreur) {
    throw new ErreurArguments(traduireErreurArguments(erreur));
  }
  const { lister, beneficiaires, revoquer, aide, ...creation } = lus;
  if (aide) return { action: 'aide' };
  const autres = [lister, beneficiaires, revoquer].filter((v) => v !== undefined).length;
  if (autres > 0) {
    if (autres > 1 || Object.keys(creation).length > 0) {
      throw new ErreurArguments('--lister, --beneficiaires et --revoquer s’emploient seuls.');
    }
    if (lister) return { action: 'lister' };
    if (beneficiaires !== undefined) {
      return { action: 'beneficiaires', id: identifiant('--beneficiaires', beneficiaires) };
    }
    return { action: 'revoquer', id: identifiant('--revoquer', revoquer) };
  }
  const lue = schemaCreation.safeParse(creation);
  if (!lue.success) throw new ErreurArguments(z.prettifyError(lue.error));
  const { libelle, boosters, utilisations, expire, jours = 30, site } = lue.data;
  // --expire : valable tout le jour indiqué, jusqu'à minuit UTC.
  const expireLe = expire ? finDuJour(expire) : new Date(maintenant.getTime() + jours * JOUR_MS);
  if (expireLe <= maintenant) throw new ErreurArguments('--expire est déjà passé.');
  return { action: 'creer', libelle, boosters, utilisations, expireLe, site };
}

/** « expire le … », « expiré le … » ou « révoqué le … ». */
function echeance(code: ResumeCodeBoosters, maintenant: Date): string {
  if (code.revoqueLe) return `révoqué le ${dateUtc(code.revoqueLe)}`;
  const expire = statutCodeBoosters(code, maintenant) === 'expire';
  return `${expire ? 'expiré le' : 'expire le'} ${dateUtc(code.expireLe)}`;
}

/**
 * Exécute la commande ; chaque ligne à montrer passe par `ecrire`. Renvoie faux si elle n'a rien pu faire (code
 * inconnu, ou révocation d'un code déjà expiré).
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
      const { id, code } = await creerCodeBoosters(base, commande, cle);
      ecrire(
        `Code « ${commande.libelle} » créé (${id}) : ${commande.boosters} booster(s) pour ` +
          `${commande.utilisations} joueur(s) au plus, jusqu’au ${dateUtc(commande.expireLe)}.`,
      );
      ecrire(`Code, affiché cette seule fois : ${code}`);
      ecrire(`Lien à envoyer : ${lienCodeBoosters(code, commande.site)}`);
      return true;
    }
    case 'lister': {
      const liste = await listerCodesBoosters(base);
      if (liste.length === 0) ecrire('Aucun code de boosters.');
      for (const code of liste) {
        ecrire(
          `${code.id}  « ${code.libelle} »  ${code.boosters} booster(s), ` +
            `${code.utilisations}/${code.utilisationsMax} utilisé(s), ${echeance(code, maintenant)}`,
        );
      }
      return true;
    }
    case 'beneficiaires': {
      const beneficiaires = await beneficiairesCodeBoosters(base, commande.id);
      if (!beneficiaires) {
        ecrire(`Aucun code de boosters ne porte l’identifiant ${commande.id}.`);
        return false;
      }
      if (beneficiaires.length === 0) ecrire('Personne n’a encore utilisé ce code.');
      for (const b of beneficiaires) {
        ecrire(`${dateUtc(b.recuLe)}  ${b.pseudo} (${b.joueurId})  ${b.boosters} booster(s)`);
      }
      return true;
    }
    case 'revoquer': {
      const revoque = await revoquerCodeBoosters(base, commande.id, maintenant);
      ecrire(
        revoque
          ? `Code ${commande.id} révoqué : il n’offre plus de booster ; les boosters déjà reçus restent.`
          : `Aucun code en cours ne porte l’identifiant ${commande.id} (inconnu, déjà expiré ou révoqué).`,
      );
      return revoque;
    }
  }
}
