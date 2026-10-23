import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { limiter, type LimitesDebit } from '../limites.ts';

// Contrat : apps/api/openapi/erreurs.yaml (US-051). Les erreurs JavaScript des navigateurs rejoignent celles de l'API
// dans Error Reporting, par le journal : aucun service de plus, aucune donnée de joueur.

/** Error Reporting reconnaît à ce type un événement d'erreur, même sans pile d'appels qu'il sache lire. */
export const EVENEMENT_ERREUR =
  'type.googleapis.com/google.devtools.clouderrorreporting.v1beta1.ReportedErrorEvent';

/** Le service sous lequel Error Reporting range les erreurs du front. */
export const SERVICE_FRONT = 'hipmaster-web';

export const MESSAGE_MAX = 500;
export const PILE_MAX = 4000;
export const PAGE_MAX = 200;

const corps = z.object({
  message: z.string().trim().min(1).max(MESSAGE_MAX),
  // Un chemin seul, sans paramètres ni fragment : le lien d'invitation porte son code en paramètre (US-072).
  page: z
    .string()
    .max(PAGE_MAX)
    .regex(/^\/[^?#\s]*$/),
  // Le nom du script principal du build (main-XXXX), qui désigne la version publiée.
  version: z
    .string()
    .max(40)
    .regex(/^[\w.-]+$/),
  pile: z.string().max(PILE_MAX).optional(),
});

/** Le texte lu par Error Reporting : la pile d'appels, précédée du message quand elle ne le reprend pas. */
function texteErreur(message: string, pile: string | undefined): string {
  if (!pile) return message;
  return pile.includes(message) ? pile : `${message}\n${pile}`;
}

export const routesErreurs: FastifyPluginAsyncZod<{ limites?: LimitesDebit }> = async (
  app,
  { limites },
) => {
  app.post(
    '/erreurs',
    {
      config: limiter(limites, 'erreurNavigateur'),
      schema: { body: corps, response: { 204: z.null() } },
    },
    async (requete, reponse) => {
      const { message, page, version, pile } = requete.body;
      // Le lieu sert à Error Reporting quand la pile manque ou vient d'un navigateur dont il ne lit pas le format.
      requete.log.error(
        {
          '@type': EVENEMENT_ERREUR,
          serviceContext: { service: SERVICE_FRONT, version },
          context: {
            reportLocation: { filePath: page, lineNumber: 0, functionName: 'navigateur' },
          },
        },
        texteErreur(message, pile),
      );
      return reponse.status(204).send(null);
    },
  );
};
