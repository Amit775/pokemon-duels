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
  public pokemon = input.required<Pokemon>();
  public x = input(0);
  public y = input(0);
  // Percentage-based positioning for responsive layout
  public xPercent = input<number | null>(null);
  public yPercent = input<number | null>(null);
  public selected = input(false);
  public draggable = input(false);

  public pokemonClicked = output<Pokemon>();

  protected readonly species = computed<PokemonSpecies | undefined>(() =>
    getSpecies(this.pokemon().speciesId),
  );

  protected readonly imageUrl = computed(() => this.species()?.imageUrl ?? '');
  protected readonly name = computed(() => this.species()?.name ?? 'Unknown');
  protected readonly movement = computed(() => this.species()?.movement ?? 0);
  protected readonly type = computed(() => this.species()?.type ?? 'normal');
  protected readonly playerId = computed(() => this.pokemon().playerId);

  // Position with units - use percentage if provided, otherwise pixels
  protected readonly positionLeft = computed(() => {
    const percent = this.xPercent();
    return percent !== null ? `${percent}%` : `${this.x()}px`;
  });

  protected readonly positionTop = computed(() => {
    const percent = this.yPercent();
    return percent !== null ? `${percent}%` : `${this.y()}px`;
  });

  protected onClick(): void {
    this.pokemonClicked.emit(this.pokemon());
  }
}
