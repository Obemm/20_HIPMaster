import { EventEmitter } from 'node:events';
import type { AddressInfo } from 'node:net';
import { describe, expect, it } from 'vitest';
import { construireApp } from './app.ts';
import { arreterSurSignal, type Processus } from './arret.ts';

/** Un processus factice : les signaux s'y émettent à la main, et la sortie se lit sur une promesse. */
function processusFactice() {
  const emetteur = new EventEmitter();
  const sortie = Promise.withResolvers<number>();
  const processus: Processus = {
    once: (signal, ecouteur) => emetteur.once(signal, ecouteur),
    exit: (code) => sortie.resolve(code),
  };
  return {
    processus,
    signal: (nom: NodeJS.Signals) => emetteur.emit(nom, nom),
    sortie: sortie.promise,
  };
}

describe('arrêt propre sur SIGTERM (US-046)', () => {
  it('termine les requêtes en cours, refuse les nouvelles, ferme la base puis quitte', async () => {
    const evenements: string[] = [];
    const enCours = Promise.withResolvers<void>();
    const commencee = Promise.withResolvers<void>();

    const app = construireApp();
    app.get('/api/v1/essais/lente', async () => {
      commencee.resolve();
      await enCours.promise;
      evenements.push('réponse');
      return { fini: true };
    });
    // Ce que fait le serveur : fermer le pool de connexions quand l'API s'arrête.
    app.addHook('onClose', async () => {
      evenements.push('base fermée');
    });
    const { processus, signal, sortie } = processusFactice();
    arreterSurSignal(app, { processus });
    await app.listen({ host: '127.0.0.1', port: 0 });
    const { port } = app.server.address() as AddressInfo;
    const url = `http://127.0.0.1:${port}/api/v1`;

    const lente = fetch(`${url}/essais/lente`);
    await commencee.promise;
    signal('SIGTERM');
    await expect.poll(() => app.server.listening).toBe(false);

    // Une nouvelle requête est refusée : connexion impossible, ou 503 sur une connexion déjà ouverte.
    const nouvelle = await fetch(`${url}/sante`).then(
      (reponse) => reponse.status,
      () => 'refusée',
    );
    expect([503, 'refusée']).toContain(nouvelle);
    expect(evenements).toEqual([]);

    enCours.resolve();
    const reponse = await lente;
    expect(reponse.status).toBe(200);
    expect(await reponse.json()).toEqual({ fini: true });
    expect(await sortie).toBe(0);
    expect(evenements).toEqual(['réponse', 'base fermée']);
  });

  it('force la sortie quand l’arrêt dépasse le délai', async () => {
    const app = construireApp();
    app.addHook('onClose', () => new Promise<void>(() => undefined));
    const { processus, signal, sortie } = processusFactice();
    arreterSurSignal(app, { processus, delaiMs: 50 });
    await app.ready();

    signal('SIGTERM');
    expect(await sortie).toBe(1);
  });

  it('un second signal ne relance pas l’arrêt', async () => {
    const app = construireApp();
    let fermetures = 0;
    app.addHook('onClose', async () => {
      fermetures += 1;
    });
    const { processus, signal, sortie } = processusFactice();
    arreterSurSignal(app, { processus });
    await app.ready();

    signal('SIGTERM');
    signal('SIGINT');
    expect(await sortie).toBe(0);
    expect(fermetures).toBe(1);
  });
});
