import { Component } from '@angular/core';
import { Icone } from '../icone';

/** La règle en quelques lignes, pour comprendre comment gagner sans lire docs/produit/regles.md (US-013). */
@Component({
  selector: 'hip-regle-courte',
  imports: [Icone],
  template: `
    <div class="flex flex-col gap-3 text-sm">
      <p>
        <strong>Comment gagner ?</strong> Votre SI et celui du bot démarrent à
        <strong>20 de SLA</strong>. Faites tomber le SLA du bot à <strong>0</strong> : vous gagnez.
        Si personne n’y arrive en 20 tours, le meilleur SLA l’emporte.
      </p>
      <div>
        <p class="font-semibold">À chaque tour :</p>
        <ol class="ml-5 list-decimal">
          <li>
            Vous piochez une carte et recevez du <strong>Débit</strong>
            <hip-icone nom="debit" class="size-3.5 text-amber-600 dark:text-amber-400" /> : 1 au
            premier tour, puis 1 de plus à chaque tour (10 au plus).
          </li>
          <li>
            <strong>Posez</strong> des cartes de votre main en payant leur coût en Débit (le chiffre
            à côté de l’éclair).
          </li>
          <li>
            <strong>Attaquez</strong> avec les composants posés aux tours précédents : le SI du bot
            (il perd autant de SLA que l’attaque
            <hip-icone nom="attaque" class="size-3.5 text-red-600 dark:text-red-400" />), ou un
            composant du bot, qui riposte (chacun perd des PV
            <hip-icone nom="pv" class="size-3.5 text-blue-600 dark:text-blue-400" />, à 0 il est
            détruit).
          </li>
          <li><strong>Finissez votre tour</strong> : le bot joue à son tour.</li>
        </ol>
      </div>
      <ul class="ml-5 list-disc">
        <li>
          Les cartes ont parfois des <strong>capacités</strong>, écrites sous leur nom. La plus
          importante : <strong>Garde</strong>. Une carte avec Garde protège son camp : tant qu’elle
          est en jeu, l’adversaire doit l’attaquer <em>avant</em> les autres composants et avant le
          SI. Exemple : si le bot pose l’Adaptateur SAP (Garde), vous ne pouvez plus attaquer son SI
          tant que vous ne l’avez pas détruit. Pendant la partie, l’encadré « Capacités en jeu »
          explique toutes celles des cartes visibles.
        </li>
        <li>
          Pas assez de Débit ? <strong>Décommissionnez</strong> une carte de votre main (une fois
          par tour) : elle rapporte du Débit tout de suite.
        </li>
      </ul>
    </div>
  `,
})
export class RegleCourte {}
