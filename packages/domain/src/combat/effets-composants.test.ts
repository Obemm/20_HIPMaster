import { describe, expect, it } from 'vitest';
import { codeErreur, jouer, pv, scenario } from './aide-tests.ts';
import { effetsALaPose } from './effets-composants.ts';
import { nouveauComposant } from './outils.ts';
import { actionsPossibles } from './possibles.ts';
import { CARTES_PRISES_EN_CHARGE } from './prise-en-charge.ts';
import { vueDe } from './vue.ts';

const idsMain = (etat: ReturnType<typeof scenario>) => etat.joueurs.j1.main.map((c) => c.id);

describe('effets à la pose : pioche ciblée', () => {
  it('webMethods Designer pioche la première carte Patterns de la pioche', () => {
    const apres = jouer(scenario({ main: [14], pioche: [4, 55, 22] }), {
      type: 'poser',
      carte: 'm1',
    });
    expect(idsMain(apres)).toEqual(['p2']);
    expect(apres.joueurs.j1.pioche.map((c) => c.id)).toEqual(['p1', 'p3']);
  });

  it('Apigee API Hub pioche une carte API ou IA ; Event Portal, une carte EDA', () => {
    const hub = jouer(scenario({ main: [19], pioche: [4, 41, 22] }), {
      type: 'poser',
      carte: 'm1',
    });
    expect(idsMain(hub)).toEqual(['p2']);
    const portail = jouer(scenario({ main: [32], pioche: [22, 36] }), {
      type: 'poser',
      carte: 'm1',
    });
    expect(idsMain(portail)).toEqual(['p2']);
  });

  it('ne pioche rien quand aucune carte de la famille n’est dans la pioche', () => {
    const apres = jouer(scenario({ main: [14], pioche: [4, 22] }), { type: 'poser', carte: 'm1' });
    expect(idsMain(apres)).toEqual([]);
  });

  it('CDC pioche une carte par composant Fichiers en jeu chez vous', () => {
    const apres = jouer(scenario({ main: [34], plateau: [4, 5, 22], pioche: [22, 22, 22] }), {
      type: 'poser',
      carte: 'm1',
    });
    expect(idsMain(apres)).toEqual(['p1', 'p2']);
  });
});

describe('effets à la pose : renfort', () => {
  it('OpenAPI se pose sur un composant API, qui gagne +1 attaque', () => {
    const etat = scenario({ main: [23], plateau: [22, 17] });
    expect(actionsPossibles(etat).filter((a) => a.type === 'poser')).toEqual([
      { type: 'poser', carte: 'm1', cible: 'a1' },
    ]);
    expect(codeErreur(etat, { type: 'poser', carte: 'm1' })).toBe('cible-invalide');
    expect(codeErreur(etat, { type: 'poser', carte: 'm1', cible: 'a2' })).toBe('cible-invalide');
    const apres = jouer(etat, { type: 'poser', carte: 'm1', cible: 'a1' });
    expect(vueDe(apres, 'j1').moi.plateau[0]?.attaque).toBe(4);
  });

  it('OpenAPI sans composant API à renforcer se pose quand même, sans effet', () => {
    const etat = scenario({ main: [23], plateau: [17] });
    expect(codeErreur(etat, { type: 'poser', carte: 'm1', cible: 'a1' })).toBe('cible-invalide');
    expect(codeErreur(etat, { type: 'poser', carte: 'm1' })).toBeNull();
  });

  it('AsyncAPI renforce un composant EDA', () => {
    const apres = jouer(scenario({ main: [38], plateau: [36] }), {
      type: 'poser',
      carte: 'm1',
      cible: 'a1',
    });
    expect(vueDe(apres, 'j1').moi.plateau[0]?.attaque).toBe(2);
  });
});

describe('effets permanents', () => {
  it('Cron : un seul composant Batch par tour attaque malgré son attaque au tour précédent', () => {
    let etat = scenario({
      plateau: [{ numero: 3, dernierTourAttaque: 2 }, { numero: 3, dernierTourAttaque: 2 }, 6],
    });
    etat = jouer(etat, { type: 'attaquer', attaquant: 'a1', cible: 'si' });
    expect(etat.joueurs.j2.sla).toBe(15);
    expect(codeErreur(etat, { type: 'attaquer', attaquant: 'a2', cible: 'si' })).toBe(
      'ne-peut-pas-attaquer',
    );
  });

  it('Cron sans capacités (Contexte saturé…) ne lève plus la règle Batch', () => {
    const etat = scenario({ plateau: [{ numero: 3, dernierTourAttaque: 2 }, 6] });
    const cron = etat.joueurs.j1.plateau[1];
    if (cron) cron.sansCapacitesJusquAuTour = etat.tour;
    expect(codeErreur(etat, { type: 'attaquer', attaquant: 'a1', cible: 'si' })).toBe(
      'ne-peut-pas-attaquer',
    );
  });

  it('Base vectorielle : vos agents en jeu, puis ceux posés ensuite, ont +1 PV', () => {
    const etat = jouer(scenario({ main: [49], plateau: [42] }), { type: 'poser', carte: 'm1' });
    expect(pv(etat, 'j1', 'a1')).toBe(4);
    // L'Agent n'est jouable qu'avec US-020 : on applique directement l'effet d'une pose ultérieure.
    const agent = nouveauComposant({ id: 'n1', numero: 42 }, etat.joueurs.j1.tours);
    etat.joueurs.j1.plateau.push(agent);
    effetsALaPose(etat, 'j1', agent, undefined);
    expect(pv(etat, 'j1', 'n1')).toBe(4);
  });
});

describe('cartes prises en charge', () => {
  it('couvre les 71 cartes du set 1 depuis US-020', () => {
    expect(CARTES_PRISES_EN_CHARGE).toEqual(Array.from({ length: 71 }, (_, i) => i + 1));
  });
});
