import { HttpErrorResponse } from '@angular/common/http';
import { messageActionRefusee, problemeDe } from './probleme';

const refus = (corps: unknown) =>
  new HttpErrorResponse({ status: 422, error: corps, url: '/api/v1/parties/x/actions' });

describe('messageActionRefusee (US-082)', () => {
  it('en français, garde le texte précis de l’API', () => {
    expect(
      messageActionRefusee(
        refus({ code: 'origine-invalide', detail: 'Cette évolution se pose sur SFTP.' }),
      ),
    ).toBe('Cette évolution se pose sur SFTP.');
  });

  it('sans texte de l’API, prend le message du code, puis un message générique', () => {
    expect(messageActionRefusee(refus({ code: 'debit-insuffisant' }))).toBe(
      'Pas assez de Débit pour jouer cette carte.',
    );
    expect(messageActionRefusee(refus(null))).toBe('Action refusée.');
  });

  it('lit le corps Problem Details d’une erreur HTTP, et rien d’autre', () => {
    expect(problemeDe(refus({ code: 'garde' }))?.code).toBe('garde');
    expect(problemeDe(new Error('x'))).toBeNull();
  });
});
