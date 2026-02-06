import { Component, ChangeDetectionStrategy, inject, OnInit, computed, signal } from '@angular/core';
import { GameStore, BoardService, Spot, Pokemon, getSpecies, POKEMON_SPECIES } from '@pokemon-duel/board';
import { BenchComponent } from '../../components/bench/bench.component';
import { PokemonComponent } from '../../components/pokemon/pokemon.component';
import { PassageComponent } from '../../components/passage/passage.component';
import { SpotComponent } from '../../components/spot/spot.component';

@Component({
  selector: 'app-game-board',
  standalone: true,
  imports: [BenchComponent, PokemonComponent, PassageComponent, SpotComponent],
  providers: [GameStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './game-board.component.html',
  styleUrl: './game-board.component.scss',
})
export class GameBoardComponent implements OnInit {
  protected readonly gameStore = inject(GameStore);
  protected readonly boardService = inject(BoardService);

  // Computed signals for template
  protected readonly spots = computed(() => this.gameStore.spots());
  protected readonly passages = computed(() => this.gameStore.passages());
  protected readonly pokemonOnBoard = computed(() => this.gameStore.pokemonOnBoard());
  protected readonly currentPlayerId = computed(() => this.gameStore.currentPlayerId());
  protected readonly selectedPokemonId = computed(() => this.gameStore.selectedPokemonId());
  protected readonly validMoveTargets = computed(() => this.gameStore.validMoveTargets());
  protected readonly phase = computed(() => this.gameStore.phase());

  // Player benches
  protected readonly player1Bench = computed(() => 
    this.gameStore.benchPokemon().filter(p => p.playerId === 1)
  );
  protected readonly player2Bench = computed(() => 
    this.gameStore.benchPokemon().filter(p => p.playerId === 2)
  );

  // Get Pokemon at a spot for rendering
  protected getPokemonAtSpot(spotId: string): Pokemon | undefined {
    return this.pokemonOnBoard().find(p => p.spotId === spotId);
  }

  // Get spot coordinates for Pokemon
  protected getSpotCoords(spotId: string): { x: number; y: number } | null {
    const spot = this.spots().find(s => s.id === spotId);
    return spot ? { x: spot.x, y: spot.y } : null;
  }

  ngOnInit(): void {
    this.loadBoardAndStart();
  }

  private loadBoardAndStart(): void {
    // Try to load board from localStorage
    const board = this.boardService.loadBoard();
    if (board) {
      this.gameStore.initializeGame(board.spots, board.passages, 2);
      this.gameStore.setupInitialPokemon();
    }
  }

  protected onSpotClick(spot: Spot): void {
    const selectedId = this.selectedPokemonId();
    
    // If a Pokemon is selected and this is a valid target, move it
    if (selectedId && this.validMoveTargets().includes(spot.id)) {
      this.gameStore.movePokemon(selectedId, spot.id);
      this.gameStore.endTurn();
      return;
    }

    // If clicking a spot with a Pokemon, select it (if current player's)
    const pokemonAtSpot = this.getPokemonAtSpot(spot.id);
    if (pokemonAtSpot && pokemonAtSpot.playerId === this.currentPlayerId()) {
      this.gameStore.selectPokemon(pokemonAtSpot.id);
    }
  }

  protected onPokemonClick(pokemon: Pokemon): void {
    if (pokemon.playerId === this.currentPlayerId()) {
      this.gameStore.selectPokemon(pokemon.id);
    }
  }

  protected onBenchPokemonSelect(pokemon: Pokemon): void {
    if (pokemon.playerId === this.currentPlayerId()) {
      this.gameStore.selectPokemon(pokemon.id);
    }
  }

  protected skipTurn(): void {
    this.gameStore.clearSelection();
    this.gameStore.endTurn();
  }

  protected resetGame(): void {
    this.gameStore.resetGame();
    this.gameStore.setupInitialPokemon();
  }

  protected isValidTarget(spotId: string): boolean {
    return this.validMoveTargets().includes(spotId);
  }
}
