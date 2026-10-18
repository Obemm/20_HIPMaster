/** « 2 j 5 h », « 3 h 12 min », « 8 min » : une durée lisible, arrondie à la minute. */
export function duree(ms: number): string {
  const minutes = Math.max(0, Math.round(ms / 60_000));
  const jours = Math.floor(minutes / 1440);
  const heures = Math.floor((minutes % 1440) / 60);
  const reste = minutes % 60;
  if (jours > 0) return `${jours} j ${heures} h`;
  if (heures > 0) return `${heures} h ${reste} min`;
  return `${reste} min`;
}

/** Temps restant avant une échéance (ISO), ou `null` si elle est passée ou absente. */
export function resteAvant(echeance: string | null, maintenant = Date.now()): string | null {
  if (!echeance) return null;
  const ms = new Date(echeance).getTime() - maintenant;
  return ms > 0 ? duree(ms) : null;
}
