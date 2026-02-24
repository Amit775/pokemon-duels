import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { Pokemon, PokemonSpecies, getSpecies } from '@pokemon-duel/board';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-bench',
  standalone: true,
  imports: [MatChipsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './bench.component.html',
  styleUrl: './bench.component.scss',
})
export class BenchComponent {
  // Inputs
  pokemon = input.required<Pokemon[]>();
  playerId = input.required<number>();
  selectedPokemonId = input<string | null>(null);
  isCurrentPlayer = input(false);

  // Outputs
  pokemonSelected = output<Pokemon>();

  // Methods
  protected onPokemonClick(pokemon: Pokemon): void {
    this.pokemonSelected.emit(pokemon);
  }

  protected getSpecies(speciesId: string): PokemonSpecies | undefined {
    return getSpecies(speciesId);
  }
}
