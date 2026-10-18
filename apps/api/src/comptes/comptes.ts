import { createHash, randomBytes, randomInt } from 'node:crypto';
import { REGLES_BOOSTERS } from '@hipmaster/domain';
import { eq } from 'drizzle-orm';
import type { Base } from '../db/index.ts';
import { joueurs, sessions } from '../db/schema.ts';

/** Comptes invités (US-022, ADR 0017) : jetons de session et codes de récupération, jamais stockés en clair. */

export interface Joueur {
  id: string;
  pseudo: string;
}

/** 32 symboles sans caractères ambigus (ni I, O, 0, 1) : 5 bits par caractère, 60 bits pour 12 caractères. */
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const LONGUEUR_CODE = 12;

const empreinte = (secret: string) => createHash('sha256').update(secret).digest('hex');

/** Un code de récupération lisible : « ABCD-EFGH-JKLM ». */
function nouveauCode(): string {
  const caracteres = Array.from(
    { length: LONGUEUR_CODE },
    () => ALPHABET[randomInt(ALPHABET.length)],
  );
  return [0, 4, 8].map((i) => caracteres.slice(i, i + 4).join('')).join('-');
}

/** Forme canonique d'un code saisi : majuscules, sans espaces ni tirets. */
const normaliserCode = (code: string) => code.toUpperCase().replaceAll(/[^A-Z0-9]/g, '');

const nouveauJeton = () => randomBytes(32).toString('base64url');

async function ouvrirSession(base: Base, joueurId: string): Promise<string> {
  const jeton = nouveauJeton();
  await base.insert(sessions).values({ empreinteJeton: empreinte(jeton), joueurId });
  return jeton;
}

/** Crée un compte invité ; renvoie le jeton de la première session et le code de récupération (une seule fois). */
export async function creerJoueur(
  base: Base,
  pseudo: string,
): Promise<{ joueur: Joueur; jeton: string; codeRecuperation: string }> {
  const codeRecuperation = nouveauCode();
  const [joueur] = await base
    .insert(joueurs)
    .values({
      pseudo,
      empreinteCode: empreinte(normaliserCode(codeRecuperation)),
      // Cadeau de bienvenue (US-023).
      boosters: REGLES_BOOSTERS.bienvenue,
    })
    .returning({ id: joueurs.id, pseudo: joueurs.pseudo });
  if (!joueur) throw new Error('Création du joueur impossible.');
  return { joueur, jeton: await ouvrirSession(base, joueur.id), codeRecuperation };
}

/** Ouvre une session sur un nouvel appareil à partir du code de récupération ; `null` si le code est inconnu. */
export async function connecterParCode(
  base: Base,
  code: string,
): Promise<{ joueur: Joueur; jeton: string } | null> {
  const [joueur] = await base
    .select({ id: joueurs.id, pseudo: joueurs.pseudo })
    .from(joueurs)
    .where(eq(joueurs.empreinteCode, empreinte(normaliserCode(code))));
  if (!joueur) return null;
  return { joueur, jeton: await ouvrirSession(base, joueur.id) };
}

/** Le joueur d'un jeton de session ; `null` si la session n'existe pas (ou plus). */
export async function joueurDuJeton(base: Base, jeton: string): Promise<Joueur | null> {
  const [joueur] = await base
    .select({ id: joueurs.id, pseudo: joueurs.pseudo })
    .from(sessions)
    .innerJoin(joueurs, eq(sessions.joueurId, joueurs.id))
    .where(eq(sessions.empreinteJeton, empreinte(jeton)));
  return joueur ?? null;
}

export async function fermerSession(base: Base, jeton: string): Promise<void> {
  await base.delete(sessions).where(eq(sessions.empreinteJeton, empreinte(jeton)));
}

/** Remplace le code de récupération ; l'ancien cesse aussitôt de fonctionner. */
export async function regenererCode(base: Base, joueurId: string): Promise<string> {
  const codeRecuperation = nouveauCode();
  await base
    .update(joueurs)
    .set({ empreinteCode: empreinte(normaliserCode(codeRecuperation)) })
    .where(eq(joueurs.id, joueurId));
  return codeRecuperation;
}
