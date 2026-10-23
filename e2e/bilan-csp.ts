/**
 * Fin des parcours sur le build de production (US-050) : le serveur local (hebergement-local.ts) a consigné chaque
 * violation de la CSP que le navigateur lui a signalée. Une seule suffit à faire échouer la série : sous la vraie
 * CSP de Firebase Hosting, ce style ou ce script serait bloqué chez les joueurs.
 */
type Violation = Record<string, unknown>;

const decrire = (violation: Violation) =>
  `- ${String(violation['effective-directive'] ?? violation['violated-directive'])} : ` +
  `${String(violation['blocked-uri'])} (page ${String(violation['document-uri'])})`;

export default async function bilanCsp(): Promise<void> {
  const reponse = await fetch('http://localhost:4300/__/rapports-csp');
  const violations = (await reponse.json()) as Violation[];
  if (violations.length > 0) {
    throw new Error(
      `${violations.length} violation(s) de la CSP pendant les parcours :\n${violations.map(decrire).join('\n')}`,
    );
  }
  console.log('CSP : aucune violation pendant les parcours.');
}
