import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { BattleResult, Pokemon, getSpecies } from '@pokemon-duel/board';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-battle-toast',
  standalone: true,
  imports: [MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './battle-toast.component.html',
  styleUrl: './battle-toast.component.scss',
})
export class BattleToastComponent {
  battle = input.required<BattleResult>();
  pokemon = input.required<Pokemon[]>();

  dismiss = output<void>();

  protected getSpeciesName(speciesId: string): string {
    return getSpecies(speciesId)?.name ?? 'Unknown';
  }

  protected getPokemonById(id: string): Pokemon | undefined {
    return this.pokemon().find((p) => p.id === id);
  }
}
