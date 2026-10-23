import { Component, input } from '@angular/core';
import { Icone } from '../icone';
import { type Adversaire, BOT } from './journal';

/** La règle en quelques lignes, pour comprendre comment gagner sans lire docs/produit/regles.md (US-013). */
@Component({
  selector: 'hip-regle-courte',
  imports: [Icone],
  template: `
    <div class="flex flex-col gap-3 text-sm">
      <p>
        <strong>Comment gagner ?</strong> Votre SI et celui {{ adversaire().de }} démarrent à
        <strong>20 de SLA</strong>. Faites tomber le SLA {{ adversaire().de }} à
        <strong>0</strong> : vous gagnez. Si personne n’y arrive en 20 tours, le meilleur SLA
        l’emporte.
      </p>
      <div>
        <p class="font-semibold">À chaque tour :</p>
        <ol class="ml-5 list-decimal">
          <li>
            Vous piochez une carte et recevez du <strong>Débit</strong>
            <hip-icone nom="debit" class="size-3.5 text-amber-600 dark:text-amber-400" /> : 1 au
            premier tour, puis 1 de plus à chaque tour (10 au plus). Si vous jouez en second, votre
            premier tour vous en donne 2 au lieu de 1 : commencer ne donne pas d’avance.
          </li>
          <li>
            <strong>Posez</strong> des cartes de votre main en payant leur coût en Débit (le chiffre
            à côté de l’éclair).
          </li>
          <li>
            <strong>Attaquez</strong> : rien n’attaque tout seul. Pour chaque composant posé aux
            tours précédents, <strong>sélectionnez l’attaquant</strong> (un de vos composants), puis
            <strong>sa cible</strong> : le SI {{ adversaire().de }} (il perd autant de SLA que
            l’attaque <hip-icone nom="attaque" class="size-3.5 text-red-600 dark:text-red-400" />),
            ou un composant {{ adversaire().de }}, qui riposte (chacun perd des PV
            <hip-icone nom="pv" class="size-3.5 text-blue-600 dark:text-blue-400" />, à 0 il est
            détruit). Puis <strong>confirmez</strong> avec le bouton « Attaquer avec… » sous le
            détail de la cible. Toucher une carte ou un composant ne fait que l’afficher en grand :
            regardez tout, attaquez quand vous voulez. Un tour où vous ne faites que poser ne fait
            aucun dégât.
            <p class="mt-1 text-texte-doux">
              <em>Exemple de riposte :</em> API REST (attaque 3, PV 2) attaque Adaptateur JDBC
              (attaque 2, PV 3). JDBC perd 3 PV : détruit. API REST perd 2 PV en riposte : détruite
              aussi.
            </p>
          </li>
          <li><strong>Finissez votre tour</strong> : {{ adversaire().nom }} joue à son tour.</li>
        </ol>
      </div>
      <ul class="ml-5 list-disc">
        <li>
          Les cartes ont parfois des <strong>capacités</strong>, écrites sous leur nom. La plus
          importante : <strong>Garde</strong>. Une carte avec Garde protège son camp : tant qu’elle
          est en jeu, l’adversaire doit l’attaquer <em>avant</em> les autres composants et avant le
          SI. Exemple : si {{ adversaire().nom }} pose l’Adaptateur SAP (Garde), vous ne pouvez plus
          attaquer son SI tant que vous ne l’avez pas détruit. Pendant la partie, l’encadré «
          Capacités en jeu » explique toutes celles des cartes visibles.
        </li>
        <li>
          Pas assez de Débit ? <strong>Décommissionnez</strong> une carte de votre main (une fois
          par tour) : elle rapporte du Débit tout de suite.
        </li>
      </ul>
    </div>
  `,
})
export class RegleCourte {
  /** L'adversaire : le bot, ou un joueur en duel (US-034). */
  readonly adversaire = input<Adversaire>(BOT);
}
