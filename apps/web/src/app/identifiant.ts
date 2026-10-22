/** Forme d'un UUID : celle des identifiants de partie et de duel (contrats OpenAPI, `format: uuid`). */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Un identifiant tiré de l'URL n'est envoyé à l'API que s'il a la forme d'un UUID (US-055) : un lien piégé comme
 * `/jouer/..%2F..%2Fv1%2Fraretes` ne doit pas faire appeler une autre route avec le jeton du joueur.
 */
export function estUuid(valeur: string): boolean {
  return UUID.test(valeur);
}
