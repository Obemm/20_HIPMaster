/**
 * Page d'accueil du site (`/`, et tout chemin sans langue, anciens liens compris) : emmène le joueur sur la même page
 * dans sa langue (US-079, ADR 0042). D'abord la langue choisie dans le sélecteur, gardée par le navigateur
 * (ADR 0032), puis la première langue du navigateur que le jeu parle, et l'anglais à défaut : le jeu s'ouvre à des
 * collègues de tous les pays.
 */
const LANGUES = ['fr', 'en'];
const CLE_LANGUE = 'hipmaster.langue';

function languePreferee() {
  try {
    const choisie = localStorage.getItem(CLE_LANGUE);
    if (LANGUES.includes(choisie)) return choisie;
  } catch {
    // Stockage refusé (navigation privée stricte) : la langue du navigateur décide.
  }
  const codes = navigator.languages?.length ? navigator.languages : [navigator.language];
  return (
    codes
      .map((code) => String(code).slice(0, 2).toLowerCase())
      .find((code) => LANGUES.includes(code)) ?? 'en'
  );
}

// `/fr` sans barre oblique arrive ici aussi : il garde sa langue.
const [, langueDuChemin, reste] = /^\/(?:(fr|en)(?=\/|$))?\/?(.*)$/s.exec(location.pathname) ?? [];
const langue = langueDuChemin ?? languePreferee();
location.replace(`/${langue}/${reste ?? ''}${location.search}${location.hash}`);
