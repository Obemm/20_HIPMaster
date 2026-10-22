import type { App } from './app.ts';

/** Cloud Run tue le conteneur 10 s après lui avoir envoyé SIGTERM : l'arrêt doit tenir avant. */
const DELAI_ARRET_MS = 8000;

/** Le strict nécessaire du processus Node, à remplacer dans les tests. */
export interface Processus {
  once(signal: NodeJS.Signals, ecouteur: (signal: NodeJS.Signals) => void): unknown;
  exit(code: number): void;
}

/**
 * Arrêt propre sur SIGTERM (Cloud Run) ou SIGINT (Ctrl+C), US-046 : l'API cesse d'accepter des requêtes, termine
 * celles en cours, exécute ses hooks `onClose` (fermeture du pool de connexions), puis quitte. Passé `delaiMs`, la
 * sortie est forcée. À appeler avant `listen`.
 */
export function arreterSurSignal(
  app: App,
  {
    delaiMs = DELAI_ARRET_MS,
    processus = process,
  }: { delaiMs?: number; processus?: Processus } = {},
): void {
  let arretEnCours = false;
  // Pendant l'arrêt, chaque réponse ferme sa connexion : une connexion gardée ouverte après sa dernière réponse
  // (keep-alive, 72 s chez Fastify) retiendrait l'arrêt jusqu'au délai de garde, et le pool ne serait jamais fermé.
  app.addHook('onSend', async (_requete, reponse, contenu) => {
    if (arretEnCours) reponse.header('connection', 'close');
    return contenu;
  });

  const arreter = (signal: NodeJS.Signals) => {
    if (arretEnCours) return;
    arretEnCours = true;
    app.log.info({ signal }, 'Arrêt demandé : fin des requêtes en cours');
    const garde = setTimeout(() => {
      app.log.error({ delaiMs }, 'Arrêt forcé : les requêtes en cours dépassent le délai');
      processus.exit(1);
    }, delaiMs);
    app.close().then(
      () => {
        clearTimeout(garde);
        app.log.info('API arrêtée');
        processus.exit(0);
      },
      (erreur: unknown) => {
        clearTimeout(garde);
        app.log.error({ err: erreur }, 'Arrêt en erreur');
        processus.exit(1);
      },
    );
  };
  processus.once('SIGTERM', arreter);
  processus.once('SIGINT', arreter);
}
