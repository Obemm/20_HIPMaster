import { describe, expect, it } from 'vitest';
import { IDS_CAPACITE } from '../capacites.ts';
import { detaillerCapacites } from '../carte.ts';
import { DECKS_PRETES } from '../combat/decks.ts';
import { NIVEAUX_BOT } from '../combat/niveaux.ts';
import { ETAPES_PARTIE_GUIDEE, etapesPartieGuidee } from '../combat/partie-guidee.ts';
import { ficheDe as ficheFrancaise } from '../fiches/index.ts';
import { problemesFiche } from '../fiches/fiche.ts';
import { SET_1 } from '../set-1.ts';
import { LANGUES } from './textes.ts';
import {
  ficheDe,
  langueOuReference,
  texteCarte,
  textesDe,
  traduireCarte,
  traduireNomme,
} from './traduire.ts';

// US-081 : chaque langue traduit tout le catalogue ; le français fait foi, et rien ne doit retomber sur lui.
const AUTRES_LANGUES = LANGUES.filter((langue) => langue !== 'fr');

describe.each(AUTRES_LANGUES)('le catalogue en %s', (langue) => {
  const textes = textesDe(langue);

  it('a ses textes', () => {
    expect(textes).toBeDefined();
  });

  it('traduit chacune des 71 cartes : nom, « En vrai », et effet quand la carte en a un', () => {
    const manquantes = SET_1.filter((carte) => {
      const traduction = textes?.cartes[carte.numero];
      return (
        !traduction?.nom.trim() ||
        !traduction.enVrai.trim() ||
        (carte.effet !== undefined) !== (traduction.effet !== undefined)
      );
    }).map((carte) => `${carte.numero} ${carte.nom}`);
    expect(manquantes).toEqual([]);
    expect(Object.keys(textes?.cartes ?? {})).toHaveLength(SET_1.length);
  });

  it('traduit chaque capacité', () => {
    for (const id of IDS_CAPACITE) {
      expect(textes?.capacites[id]?.nom.trim(), id).toBeTruthy();
      expect(textes?.capacites[id]?.description.trim(), id).toBeTruthy();
    }
  });

  it('traduit chaque fiche « En savoir plus », dans les mêmes bornes de lecture', () => {
    for (const carte of SET_1) {
      const francaise = ficheFrancaise(carte.numero);
      const traduite = textes?.fiches[carte.numero];
      if (!francaise) continue;
      expect(traduite, `fiche ${carte.numero}`).toBeDefined();
      if (!traduite) continue;
      expect(problemesFiche(traduite), `fiche ${carte.numero}`).toEqual([]);
    }
  });

  it('traduit les niveaux du bot et les decks prêtés', () => {
    for (const { id } of NIVEAUX_BOT) expect(textes?.niveaux[id]?.nom, id).toBeTruthy();
    for (const { id } of DECKS_PRETES) expect(textes?.decks[id]?.nom, id).toBeTruthy();
  });

  it('traduit chaque bulle de la partie guidée, sans changer l’action attendue', () => {
    const etapes = etapesPartieGuidee(langue);
    expect(etapes).toHaveLength(ETAPES_PARTIE_GUIDEE.length);
    etapes.forEach((etape, i) => {
      const francaise = ETAPES_PARTIE_GUIDEE[i];
      expect(etape.attendu).toEqual(francaise?.attendu);
      expect(etape.texte).not.toBe(francaise?.texte);
    });
  });
});

describe('les textes du catalogue dans la langue demandée', () => {
  it('une carte traduite garde ses règles, seuls ses textes changent', () => {
    const sap = SET_1.find((carte) => carte.numero === 13);
    expect(sap).toBeDefined();
    if (!sap) return;
    const anglaise = traduireCarte(sap, 'en');
    expect(anglaise.nom).toBe('SAP Adapter');
    const regles = (carte: object) =>
      Object.fromEntries(
        Object.entries(carte).filter(([cle]) => !['nom', 'enVrai', 'effet'].includes(cle)),
      );
    expect(regles(anglaise)).toEqual(regles(sap));
    expect(traduireCarte(sap, 'fr')).toBe(sap);
  });

  it('le nom de l’auteur d’une carte de la communauté ne se traduit pas (US-030)', () => {
    const sap = SET_1.find((carte) => carte.numero === 13);
    expect(sap).toBeDefined();
    if (!sap) return;
    expect(traduireCarte({ ...sap, auteur: 'Camille D.' }, 'en').auteur).toBe('Camille D.');
  });

  it('les capacités détaillées suivent la langue, valeur de Connecteur comprise', () => {
    const connecteur = SET_1.find((carte) =>
      carte.capacites.some((c) => typeof c !== 'string' && c.id === 'connecteur'),
    );
    expect(connecteur).toBeDefined();
    if (!connecteur) return;
    const noms = detaillerCapacites(connecteur, 'en').map((c) => c.nom);
    expect(noms.some((nom) => /^Connector \(\d\)$/.test(nom))).toBe(true);
    expect(detaillerCapacites(connecteur).map((c) => c.nom)).toContain(
      detaillerCapacites(connecteur, 'fr').find((c) => c.id === 'connecteur')?.nom,
    );
  });

  it('les noms de produits ne se traduisent pas', () => {
    for (const numero of [1, 9, 18, 31, 39]) {
      const carte = SET_1.find((c) => c.numero === numero);
      if (carte) expect(texteCarte(carte, 'en').nom).toBe(carte.nom);
    }
  });

  it('une langue inconnue retombe sur le français', () => {
    expect(langueOuReference('de')).toBe('fr');
    expect(langueOuReference(undefined)).toBe('fr');
    expect(langueOuReference('en')).toBe('en');
    expect(ficheDe(1, 'fr')).toBe(ficheFrancaise(1));
  });

  it('niveaux et decks se traduisent par leur identifiant', () => {
    const [stagiaire] = NIVEAUX_BOT;
    expect(stagiaire && traduireNomme(stagiaire, 'en', 'niveaux').nom).toBe('Intern');
    expect(stagiaire && traduireNomme(stagiaire, 'fr', 'niveaux').nom).toBe('Stagiaire');
  });
});
