import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { Pokemon, PokemonSpecies, getSpecies } from '@pokemon-duel/board';

@Component({
  selector: 'app-pokemon',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pokemon.component.html',
  styleUrl: './pokemon.component.scss',
})
export class PokemonComponent {
  // Inputs
  pokemon = input.required<Pokemon>();
  x = input(0);
  y = input(0);
  // Percentage-based positioning for responsive layout
  xPercent = input<number | null>(null);
  yPercent = input<number | null>(null);
  selected = input(false);
  draggable = input(false);

  // Outputs
  pokemonClicked = output<Pokemon>();

  // Computed
  protected species = computed<PokemonSpecies | undefined>(() => 
    getSpecies(this.pokemon().speciesId)
  );

  protected imageUrl = computed(() => this.species()?.imageUrl ?? '');
  protected name = computed(() => this.species()?.name ?? 'Unknown');
  protected movement = computed(() => this.species()?.movement ?? 0);
  protected type = computed(() => this.species()?.type ?? 'normal');
  protected playerId = computed(() => this.pokemon().playerId);

  // Use percentage if provided, otherwise fall back to pixels
  protected usePercent = computed(() => this.xPercent() !== null && this.yPercent() !== null);

  // Methods
  protected onClick(): void {
    this.pokemonClicked.emit(this.pokemon());
  }
}
