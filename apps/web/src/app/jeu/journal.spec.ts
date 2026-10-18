import { decrireEvenement } from './journal';
import type { Evenement } from './modele';

const NOMS: Record<string, string> = {
  'j1-01': 'FTP',
  'j2-03': 'Apigee API Gateway',
  'j2-04': 'Topic',
};
const nommer = (id: string) => NOMS[id] ?? 'une carte';
const decrire = (e: Evenement) => decrireEvenement(e, 'j1', nommer);

describe('decrireEvenement', () => {
  it('raconte les tours, les poses et les attaques du point de vue du joueur', () => {
    expect(decrire({ type: 'debut-tour', joueur: 'j1', tour: 3 })).toBe(
      'Tour 3 : à vous de jouer.',
    );
    expect(decrire({ type: 'debut-tour', joueur: 'j2', tour: 4 })).toBe('Tour 4 : le bot joue.');
    expect(decrire({ type: 'pose', joueur: 'j2', carte: { id: 'j2-03', numero: 18 } })).toBe(
      'Le bot pose Apigee API Gateway.',
    );
    expect(decrire({ type: 'attaque', joueur: 'j1', attaquant: 'j1-01', cible: 'si' })).toBe(
      'FTP attaque le SI du bot.',
    );
    expect(decrire({ type: 'attaque', joueur: 'j2', attaquant: 'j2-04', cible: 'si' })).toBe(
      'Topic attaque votre SI.',
    );
  });

  it('précise la cause des dégâts et la perte de SLA', () => {
    expect(
      decrire({ type: 'degats', joueur: 'j2', cible: 'j2-04', montant: 1, cause: 'reactif' }),
    ).toBe('Topic subit 1 dégât (Réactif).');
    expect(
      decrire({ type: 'degats', joueur: 'j1', cible: 'si', montant: 2, cause: 'non-conforme' }),
    ).toBe('Votre SI perd 2 SLA (Non conforme).');
  });

  it('cache la pioche du bot, et annonce la fin de partie', () => {
    expect(
      decrire({ type: 'pioche', joueur: 'j2', carte: { id: 'j2-04', numero: 36 } }),
    ).toBeNull();
    expect(decrire({ type: 'fin-partie', issue: { gagnant: 'j1', raison: 'sla' } })).toBe(
      'Fin de la partie : vous gagnez !',
    );
    expect(decrire({ type: 'fin-partie', issue: { gagnant: null, raison: 'tours' } })).toBe(
      'Fin de la partie : égalité.',
    );
  });

  it('gère l’entretien Sur site, dont la carte n’est qu’un identifiant', () => {
    expect(decrire({ type: 'entretien', joueur: 'j1', carte: 'j1-01', paye: false })).toBe(
      'FTP : entretien impayé, pas d’attaque ce tour.',
    );
    expect(decrire({ type: 'entretien', joueur: 'j1', carte: 'j1-01', paye: true })).toBeNull();
  });

  it('raconte les sorts, les incidents et leurs effets', () => {
    expect(
      decrire({ type: 'jeu', joueur: 'j1', carte: { id: 'j1-01', numero: 1 }, cibles: ['j2-04'] }),
    ).toBe('Vous jouez FTP sur Topic.');
    expect(
      decrire({ type: 'jeu', joueur: 'j2', carte: { id: 'j2-03', numero: 18 }, cibles: [] }),
    ).toBe('Le bot joue Apigee API Gateway.');
    expect(decrire({ type: 'statut', joueur: 'j2', cible: 'j2-04', statut: 'immobilise' })).toBe(
      'Topic est immobilisé : pas d’attaque à son prochain tour.',
    );
    expect(decrire({ type: 'statut', joueur: 'j1', cible: 'si', statut: 'protection-si' })).toBe(
      'Votre SI est protégé jusqu’au prochain tour (Circuit Breaker).',
    );
    expect(decrire({ type: 'parade', joueur: 'j1', carte: { id: 'j2-04', numero: 36 } })).toBe(
      'Topic est sans effet (Human-in-the-loop).',
    );
    expect(decrire({ type: 'si-protege', joueur: 'j2' })).toBe(
      'Le SI du bot ne perd aucun SLA (Circuit Breaker).',
    );
  });
});
