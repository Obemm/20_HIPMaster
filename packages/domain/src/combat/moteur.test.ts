import { describe, expect, it } from 'vitest';
import { codeErreur, DECK_API_REST, jouer, pv, scenario } from './aide-tests.ts';
import { suivant } from './alea.ts';
import { appliquer } from './moteur.ts';
import { TOURS_MAX } from './outils.ts';
import { actionsPossibles } from './possibles.ts';
import { CARTES_PRISES_EN_CHARGE } from './prise-en-charge.ts';
import { creerPartie } from './tour.ts';
import type { EtatPartie } from './types.ts';
import { vueDe } from './vue.ts';

const DECK_VARIE = CARTES_PRISES_EN_CHARGE.slice(0, 20);

/** Joue une partie complète en choisissant au hasard (graine) parmi les actions possibles. */
function partieAuHasard(graine: number, maxActions = 2_000) {
  let etat = creerPartie({ j1: DECK_VARIE, j2: [...DECK_VARIE].reverse() }, graine);
  let alea = graine;
  const actions = [];
  while (!etat.issue && actions.length < maxActions) {
    const possibles = actionsPossibles(etat);
    const tirage = suivant(alea);
    alea = tirage.etat;
    // Finir son tour une fois sur quatre au plus, pour que la partie avance.
    const autres = possibles.filter((a) => a.type !== 'finirTour');
    const action =
      autres.length > 0 && tirage.valeur < 0.75
        ? autres[Math.floor(tirage.valeur * autres.length) % autres.length]
        : { type: 'finirTour' as const };
    if (!action) throw new Error('aucune action');
    actions.push(action);
    etat = jouer(etat, action);
  }
  return { etat, actions };
}

const finirDeuxTours = (etat: EtatPartie) =>
  jouer(jouer(etat, { type: 'finirTour' }), { type: 'finirTour' });

describe('mise en place', () => {
  it('mélange les decks, donne 4 cartes à chacun et commence le premier tour sans pioche', () => {
    const etat = creerPartie({ j1: DECK_VARIE, j2: DECK_VARIE }, 123);
    const premier = etat.joueurs[etat.premier];
    const second = etat.joueurs[etat.premier === 'j1' ? 'j2' : 'j1'];
    expect(premier.main).toHaveLength(4);
    expect(second.main).toHaveLength(4);
    expect(premier.pioche).toHaveLength(16);
    expect(premier.debit).toBe(1);
    expect(etat.actif).toBe(etat.premier);
    expect(etat.tour).toBe(1);
  });

  it('donne exactement la même partie pour la même graine', () => {
    const decks = { j1: DECK_VARIE, j2: DECK_VARIE };
    expect(creerPartie(decks, 99)).toEqual(creerPartie(decks, 99));
    expect(creerPartie(decks, 99)).not.toEqual(creerPartie(decks, 100));
  });

  it('refuse un deck qui contient une carte inconnue', () => {
    expect(() => creerPartie({ j1: [999], j2: DECK_API_REST }, 1)).toThrow('Carte inconnue');
  });
});

describe('tours, pioche et Débit', () => {
  it('fait piocher l’adversaire et lui donne un Débit égal à son numéro de tour', () => {
    const etat = scenario();
    const avant = etat.joueurs.j2.main.length;
    const apres = jouer(etat, { type: 'finirTour' });
    expect(apres.actif).toBe('j2');
    expect(apres.tour).toBe(6);
    expect(apres.joueurs.j2.main).toHaveLength(avant + 1);
    expect(apres.joueurs.j2.debit).toBe(3);
  });

  it('plafonne le Débit à 10', () => {
    const etat = scenario();
    etat.joueurs.j2.tours = 14;
    expect(jouer(etat, { type: 'finirTour' }).joueurs.j2.debit).toBe(10);
  });

  it('défausse la carte piochée quand la main est pleine, et ne pioche rien quand la pioche est vide', () => {
    const pleine = scenario();
    pleine.joueurs.j2.main = Array.from({ length: 8 }, (_, i) => ({ id: `x${i}`, numero: 22 }));
    const apres = jouer(pleine, { type: 'finirTour' });
    expect(apres.joueurs.j2.main).toHaveLength(8);
    expect(apres.journal.some((e) => e.type === 'carte-brulee')).toBe(true);

    const vide = scenario({ piocheAdverse: [] });
    const avant = vide.joueurs.j2.main.length;
    expect(jouer(vide, { type: 'finirTour' }).joueurs.j2.main).toHaveLength(avant);
  });

  it('ne modifie jamais l’état reçu', () => {
    const etat = scenario({ main: [22], plateau: [41], plateauAdverse: [16] });
    const copie = JSON.stringify(etat);
    jouer(etat, { type: 'poser', carte: 'm1' });
    jouer(etat, { type: 'attaquer', attaquant: 'a1', cible: 'b1' });
    jouer(etat, { type: 'finirTour' });
    expect(JSON.stringify(etat)).toBe(copie);
  });
});

describe('poser et décommissionner', () => {
  it('pose un composant en payant son coût', () => {
    const apres = jouer(scenario({ main: [17], debit: 5 }), { type: 'poser', carte: 'm1' });
    expect(apres.joueurs.j1.debit).toBe(2);
    expect(apres.joueurs.j1.main).toHaveLength(0);
    expect(apres.joueurs.j1.plateau.map((c) => [c.id, c.pv])).toEqual([['m1', 4]]);
  });

  it('refuse une pose sans Débit, sur un plateau plein, d’une carte absente ou pas encore jouable', () => {
    expect(codeErreur(scenario({ main: [17], debit: 2 }), { type: 'poser', carte: 'm1' })).toBe(
      'debit-insuffisant',
    );
    const plein = scenario({ main: [22], plateau: [4, 4, 4, 4, 4] });
    expect(codeErreur(plein, { type: 'poser', carte: 'm1' })).toBe('plateau-plein');
    expect(codeErreur(scenario(), { type: 'poser', carte: 'm9' })).toBe('carte-absente');
    expect(codeErreur(scenario({ main: [2] }), { type: 'poser', carte: 'm1' })).toBe(
      'carte-non-prise-en-charge',
    );
    expect(codeErreur(scenario({ main: [21] }), { type: 'poser', carte: 'm1' })).toBe(
      'mauvais-type',
    );
  });

  it('décommissionne une carte par tour, contre du Débit selon sa rareté', () => {
    const etat = scenario({ main: [1, 22], debit: 0 });
    const apres = jouer(etat, { type: 'decommissionner', carte: 'm1' });
    expect(apres.joueurs.j1.debit).toBe(3);
    expect(apres.joueurs.j1.defausse.map((c) => c.id)).toContain('m1');
    expect(codeErreur(apres, { type: 'decommissionner', carte: 'm2' })).toBe('deja-decommissionne');
  });
});

describe('attaques', () => {
  it('interdit d’attaquer le tour de la pose, et deux fois dans le même tour', () => {
    const pose = jouer(scenario({ main: [22] }), { type: 'poser', carte: 'm1' });
    expect(codeErreur(pose, { type: 'attaquer', attaquant: 'm1', cible: 'si' })).toBe(
      'ne-peut-pas-attaquer',
    );
    const une = jouer(scenario({ plateau: [22] }), {
      type: 'attaquer',
      attaquant: 'a1',
      cible: 'si',
    });
    expect(codeErreur(une, { type: 'attaquer', attaquant: 'a1', cible: 'si' })).toBe(
      'ne-peut-pas-attaquer',
    );
  });

  it('échange les dégâts entre composants et défausse ceux qui tombent à 0 PV', () => {
    const apres = jouer(scenario({ plateau: [17], plateauAdverse: [16] }), {
      type: 'attaquer',
      attaquant: 'a1',
      cible: 'b1',
    });
    expect(pv(apres, 'j1', 'a1')).toBe(2);
    expect(apres.joueurs.j2.plateau).toHaveLength(0);
    expect(apres.joueurs.j2.defausse.map((c) => c.id)).toContain('b1');
  });

  it('retire du SLA sans riposte, et donne la victoire quand le SLA tombe à 0', () => {
    const etat = scenario({ plateau: [41] });
    etat.joueurs.j2.sla = 5;
    const apres = jouer(etat, { type: 'attaquer', attaquant: 'a1', cible: 'si' });
    expect(apres.joueurs.j2.sla).toBe(-1);
    expect(apres.issue).toEqual({ gagnant: 'j1', raison: 'sla' });
    expect(codeErreur(apres, { type: 'finirTour' })).toBe('partie-terminee');
    expect(actionsPossibles(apres)).toEqual([]);
  });

  it('termine la partie après le dernier tour : le plus de SLA gagne, l’égalité donne une nulle', () => {
    const etat = scenario();
    etat.tour = TOURS_MAX;
    etat.joueurs.j1.sla = 12;
    expect(jouer(etat, { type: 'finirTour' }).issue).toEqual({ gagnant: 'j2', raison: 'tours' });
    etat.joueurs.j1.sla = 20;
    expect(jouer(etat, { type: 'finirTour' }).issue).toEqual({ gagnant: null, raison: 'tours' });
  });
});

describe('capacités', () => {
  it('Garde : il faut attaquer les composants avec Garde avant le reste et le SI', () => {
    const etat = scenario({ plateau: [17], plateauAdverse: [7, 22] });
    expect(codeErreur(etat, { type: 'attaquer', attaquant: 'a1', cible: 'b2' })).toBe('garde');
    expect(codeErreur(etat, { type: 'attaquer', attaquant: 'a1', cible: 'si' })).toBe('garde');
    expect(codeErreur(etat, { type: 'attaquer', attaquant: 'a1', cible: 'b1' })).toBeNull();
  });

  it('Batch : n’attaque pas deux tours de suite', () => {
    const recent = scenario({ plateau: [{ numero: 3, dernierTourAttaque: 2 }] });
    expect(codeErreur(recent, { type: 'attaquer', attaquant: 'a1', cible: 'si' })).toBe(
      'ne-peut-pas-attaquer',
    );
    const repose = scenario({ plateau: [{ numero: 3, dernierTourAttaque: 1 }] });
    expect(codeErreur(repose, { type: 'attaquer', attaquant: 'a1', cible: 'si' })).toBeNull();
  });

  it('Hub : les autres composants alliés ont +1 attaque', () => {
    const apres = jouer(scenario({ plateau: [9, 22] }), {
      type: 'attaquer',
      attaquant: 'a2',
      cible: 'si',
    });
    expect(apres.joueurs.j2.sla).toBe(16);
  });

  it('Point unique : sa destruction blesse les autres composants alliés, en cascade', () => {
    const etat = scenario({
      plateau: [41],
      plateauAdverse: [{ numero: 9, pv: 1 }, { numero: 22, pv: 1 }, 16],
    });
    const apres = jouer(etat, { type: 'attaquer', attaquant: 'a1', cible: 'b1' });
    expect(apres.joueurs.j2.plateau.map((c) => [c.id, c.pv])).toEqual([['b3', 2]]);
    expect(apres.joueurs.j2.defausse.map((c) => c.id)).toEqual(
      expect.arrayContaining(['b1', 'b2']),
    );
  });

  it('Quotas : pas plus de 2 attaques subies par tour', () => {
    let etat = scenario({ plateau: [17, 17, 17], plateauAdverse: [18] });
    etat = jouer(etat, { type: 'attaquer', attaquant: 'a1', cible: 'b1' });
    etat = jouer(etat, { type: 'attaquer', attaquant: 'a2', cible: 'b1' });
    expect(codeErreur(etat, { type: 'attaquer', attaquant: 'a3', cible: 'b1' })).toBe('quotas');
  });

  it('Connecteur : pioche des cartes quand la carte est posée', () => {
    const apres = jouer(scenario({ main: [24], pioche: [4, 4] }), { type: 'poser', carte: 'm1' });
    expect(apres.joueurs.j1.main.map((c) => c.id)).toEqual(['p1']);
  });

  it('Diffusion : blesse aussi 2 autres composants adverses', () => {
    const etat = scenario({ plateau: [35], plateauAdverse: [16, 16, 16, 16] });
    const apres = jouer(etat, { type: 'attaquer', attaquant: 'a1', cible: 'b1' });
    const pvs = apres.joueurs.j2.plateau.map((c) => c.pv);
    expect(pvs[0]).toBe(1);
    expect(pvs.slice(1).sort()).toEqual([2, 2, 3]);
  });

  it('Réactif : une fois par tour, l’attaquant subit 1 dégât de plus', () => {
    let etat = scenario({ plateau: [17, 17], plateauAdverse: [36, 16] });
    etat = jouer(etat, { type: 'attaquer', attaquant: 'a1', cible: 'b2' });
    expect(pv(etat, 'j1', 'a1')).toBe(1);
    etat = jouer(etat, { type: 'attaquer', attaquant: 'a2', cible: 'b1' });
    expect(pv(etat, 'j1', 'a2')).toBe(3);
  });

  it('Non conforme : le SI perd 1 SLA au début de chaque tour du propriétaire', () => {
    const apres = finirDeuxTours(scenario({ plateau: [1] }));
    expect(apres.joueurs.j1.sla).toBe(19);
  });

  it('Sur site : l’entretien coûte 1 Débit, et sans Débit la carte ne peut pas attaquer', () => {
    const paye = finirDeuxTours(scenario({ plateau: [9] }));
    expect(paye.joueurs.j1.debit).toBe(3);

    const etat = scenario({ plateau: [9, 9] });
    etat.joueurs.j1.tours = 0;
    const apres = finirDeuxTours(etat);
    expect(apres.joueurs.j1.debit).toBe(0);
    expect(codeErreur(apres, { type: 'attaquer', attaquant: 'a2', cible: 'si' })).toBe(
      'ne-peut-pas-attaquer',
    );
  });

  it('File durable : une fois par partie, un composant détruit revient en main', () => {
    let etat = scenario({
      plateau: [10, { numero: 22, pv: 1 }, { numero: 22, pv: 1 }],
      plateauAdverse: [17],
    });
    etat = jouer(etat, { type: 'attaquer', attaquant: 'a2', cible: 'b1' });
    expect(etat.joueurs.j1.main.map((c) => c.id)).toEqual(['a2']);
    etat = jouer(etat, { type: 'attaquer', attaquant: 'a3', cible: 'b1' });
    expect(etat.joueurs.j1.defausse.map((c) => c.id)).toContain('a3');
  });

  it('Supervision : révèle à son seul propriétaire la carte du dessus de la pioche adverse', () => {
    const apres = finirDeuxTours(scenario({ plateau: [11], piocheAdverse: [41, 4] }));
    const supervision = apres.journal.find((e) => e.type === 'supervision');
    expect(supervision).toMatchObject({ pour: 'j1', carte: { numero: 4 } });
    expect(vueDe(apres, 'j2').journal.some((e) => e.type === 'supervision')).toBe(false);
  });
});

describe('évolutions', () => {
  it('remplacent leur carte d’origine, PV pleins, et peuvent attaquer si l’origine le pouvait', () => {
    const etat = scenario({ plateau: [{ numero: 9, pv: 2 }], main: [26], pioche: [4, 4, 4] });
    const apres = jouer(etat, { type: 'evoluer', carte: 'm1', origine: 'a1' });
    expect(apres.joueurs.j1.plateau.map((c) => [c.id, c.numero, c.pv])).toEqual([['m1', 26, 7]]);
    expect(apres.joueurs.j1.defausse.map((c) => c.id)).toContain('a1');
    expect(apres.joueurs.j1.main.map((c) => c.id)).toEqual(['p1', 'p2']);
    expect(codeErreur(apres, { type: 'attaquer', attaquant: 'm1', cible: 'si' })).toBeNull();
  });

  it('refusent une mauvaise carte d’origine, et ne se posent pas comme un composant', () => {
    const etat = scenario({ plateau: [22], main: [26] });
    expect(codeErreur(etat, { type: 'evoluer', carte: 'm1', origine: 'a1' })).toBe(
      'origine-invalide',
    );
    expect(codeErreur(etat, { type: 'poser', carte: 'm1' })).toBe('mauvais-type');
  });
});

describe('actions possibles, vue et rejouabilité', () => {
  it('ne propose que des actions acceptées par le moteur, et toute partie se termine', () => {
    for (let graine = 1; graine <= 25; graine++) {
      const { etat } = partieAuHasard(graine);
      expect(etat.issue, `graine ${graine}`).not.toBeNull();
    }
  });

  it('propose les attaques sur Garde seulement, et toujours de finir son tour', () => {
    const actions = actionsPossibles(scenario({ plateau: [22], plateauAdverse: [7, 16] }));
    expect(actions).toContainEqual({ type: 'attaquer', attaquant: 'a1', cible: 'b1' });
    expect(actions).not.toContainEqual({ type: 'attaquer', attaquant: 'a1', cible: 'b2' });
    expect(actions).not.toContainEqual({ type: 'attaquer', attaquant: 'a1', cible: 'si' });
    expect(actions.at(-1)).toEqual({ type: 'finirTour' });
  });

  it('rejoue une partie à l’identique à partir de sa graine et de ses actions', () => {
    const { etat, actions } = partieAuHasard(2026);
    let rejouee = creerPartie({ j1: DECK_VARIE, j2: [...DECK_VARIE].reverse() }, 2026);
    for (const action of actions) rejouee = jouer(rejouee, action);
    expect(rejouee).toEqual(etat);
  });

  it('masque la main et la pioche adverses, et ne donne les actions qu’au joueur actif', () => {
    const etat = creerPartie({ j1: DECK_VARIE, j2: DECK_VARIE }, 5);
    const actif = etat.actif;
    const autre = actif === 'j1' ? 'j2' : 'j1';
    const vue = vueDe(etat, autre);
    expect(vue.adversaire.main).toBe(4);
    expect(vue.adversaire.pioche).toBe(16);
    expect(vue.actions).toEqual([]);
    expect(vue.journal.every((e) => e.pour === undefined || e.pour === autre)).toBe(true);
    expect(vueDe(etat, actif).actions.length).toBeGreaterThan(0);
  });

  it('renvoie une erreur typée sans lever d’exception', () => {
    const resultat = appliquer(scenario(), { type: 'attaquer', attaquant: 'zz', cible: 'si' });
    expect(resultat).toEqual({
      ok: false,
      erreur: { code: 'carte-absente', message: 'Ce composant n’est pas sur votre plateau.' },
    });
  });
});
