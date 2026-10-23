import { describe, expect, it } from 'vitest';
import { scenario } from './aide-tests.ts';
import { reconstituer } from './reconstitution.ts';
import { vueDe } from './vue.ts';

const APIGEE_API_GATEWAY = 18;
const APIGEE_AI_GATEWAY = 40;
const WEBMETHODS_IO = 26;
const SFTP = 2;
const API_REST = 22;
const AGENT = 42;
const PROMPT_SYSTEME = 51;
const CONTENT_BASED_ROUTER = 55;

/** La raison donnée pour chaque carte de la main de j1. */
const raisons = (etat: ReturnType<typeof scenario>) =>
  vueDe(etat, 'j1').moi.main.map((c) => c.injouable);

describe('Raison de ne pas jouer une carte de la main (US-071)', () => {
  it('dit qu’une évolution attend sa carte d’origine sur le plateau', () => {
    expect(raisons(scenario({ main: [APIGEE_AI_GATEWAY, WEBMETHODS_IO] }))).toEqual([
      'Évolution d’Apigee API Gateway : posez d’abord Apigee API Gateway, puis faites-la évoluer.',
      'Évolution de webMethods Integration Server 10.15 : posez d’abord webMethods Integration Server 10.15, puis faites-la évoluer.',
    ]);
  });

  it('ne donne aucune raison quand la carte se joue, évolution comprise', () => {
    const etat = scenario({ main: [APIGEE_AI_GATEWAY, API_REST], plateau: [APIGEE_API_GATEWAY] });
    expect(raisons(etat)).toEqual([null, null]);
  });

  it('dit le Débit qu’il faut et celui qu’on a', () => {
    const etat = scenario({
      main: [APIGEE_API_GATEWAY, APIGEE_AI_GATEWAY],
      plateau: [APIGEE_API_GATEWAY],
      debit: 3,
    });
    expect(raisons(etat)).toEqual([
      'Il vous faut 4 Débit, vous en avez 3.',
      'Il vous faut 5 Débit, vous en avez 3.',
    ]);
  });

  it('compte le coût effectif : le Cache sémantique rend le premier sort IA gratuit', () => {
    const sansCache = scenario({ main: [PROMPT_SYSTEME], plateau: [AGENT], debit: 1 });
    expect(raisons(sansCache)).toEqual(['Il vous faut 2 Débit, vous en avez 1.']);
    const avecCache = scenario({
      main: [PROMPT_SYSTEME],
      plateau: [AGENT, APIGEE_AI_GATEWAY],
      debit: 1,
    });
    expect(raisons(avecCache)).toEqual([null]);
  });

  it('dit que le plateau est plein, sauf si la carte se joue autrement (Migration)', () => {
    const plein = scenario({ main: [API_REST], plateau: [22, 22, 22, 22, 22] });
    expect(raisons(plein)).toEqual(['Plateau plein : 5 composants au plus.']);
    const migration = scenario({ main: [API_REST], plateau: [SFTP, 22, 22, 22, 22] });
    expect(raisons(migration)).toEqual([null]);
  });

  it('nomme l’obstacle le plus profond d’abord : le plateau plein avant le Débit', () => {
    const etat = scenario({ main: [APIGEE_API_GATEWAY], plateau: [22, 22, 22, 22, 22], debit: 1 });
    expect(raisons(etat)).toEqual(['Plateau plein : 5 composants au plus.']);
  });

  it('dit qu’un sort ou un incident n’a aucune cible possible', () => {
    expect(raisons(scenario({ main: [CONTENT_BASED_ROUTER] }))).toEqual([
      'Aucune cible possible pour cette carte maintenant.',
    ]);
    expect(raisons(scenario({ main: [CONTENT_BASED_ROUTER], plateauAdverse: [API_REST] }))).toEqual(
      [null],
    );
  });

  it('dit que ce n’est pas votre tour pendant le tour adverse', () => {
    const etat = scenario();
    etat.joueurs.j2.main = [{ id: 'n1', numero: API_REST }];
    expect(vueDe(etat, 'j2').moi.main).toEqual([
      {
        id: 'n1',
        numero: API_REST,
        injouable: 'Ce n’est pas votre tour : attendez le vôtre pour jouer cette carte.',
      },
    ]);
  });

  it('ne donne aucune raison une fois la partie terminée', () => {
    const etat = scenario({ main: [APIGEE_AI_GATEWAY] });
    etat.issue = { gagnant: 'j1', raison: 'sla' };
    expect(vueDe(etat, 'j1').moi.main[0]).not.toHaveProperty('injouable');
  });

  it('n’est pas une donnée de l’état : la reconstitution pour les bots la retire', () => {
    const vue = vueDe(scenario({ main: [APIGEE_AI_GATEWAY] }), 'j1');
    expect(reconstituer(vue).joueurs.j1.main).toEqual([{ id: 'm1', numero: APIGEE_AI_GATEWAY }]);
  });
});
