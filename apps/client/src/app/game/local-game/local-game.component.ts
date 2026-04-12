import {
  Component,
  ChangeDetectionStrategy,
  inject,
  computed,
  signal,
  effect,
  DestroyRef,
} from '@angular/core';
import { GameStore, BoardService, Pokemon, Spot } from '@pokemon-duel/board';
import { GameBoardComponent } from '../game-board/game-board.component';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-local-game',
  standalone: true,
  imports: [GameBoardComponent, MatButtonModule, MatChipsModule, MatIconModule],
  providers: [GameStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './local-game.component.html',
  styleUrl: './local-game.component.scss',
})
export class LocalGameComponent {
  private readonly gameStore = inject(GameStore);
  private readonly boardService = inject(BoardService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly spots = this.gameStore.spots;
  protected readonly passages = this.gameStore.passages;
  protected readonly pokemonOnBoard = this.gameStore.pokemonOnBoard;
  protected readonly player1Bench = computed(() =>
    this.gameStore.benchPokemon().filter((p) => p.playerId === 1),
  );
  protected readonly player2Bench = computed(() =>
    this.gameStore.benchPokemon().filter((p) => p.playerId === 2),
  );
  protected readonly selectedPokemonId = this.gameStore.selectedPokemonId;
  protected readonly validMoveTargets = this.gameStore.validMoveTargets;
  protected readonly currentPlayerId = this.gameStore.currentPlayerId;
  protected readonly phase = this.gameStore.phase;
  protected readonly winnerId = this.gameStore.winnerId;

  protected readonly showBattle = signal(false);
  protected readonly displayBattle = computed(() =>
    this.showBattle() ? this.gameStore.lastBattle() : null,
  );

  private battleDismissTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    const board = this.boardService.loadBoard();
    if (board) {
      this.gameStore.initializeGame(board.spots, board.passages, 2);
      this.gameStore.setupInitialPokemon();
    }

    effect(() => {
      const battle = this.gameStore.lastBattle();
      if (battle) {
        this.showBattle.set(true);
        if (this.battleDismissTimer) clearTimeout(this.battleDismissTimer);
        this.battleDismissTimer = setTimeout(() => this.dismissBattle(), 5000);
      } else {
        this.showBattle.set(false);
      }
    });

    this.destroyRef.onDestroy(() => {
      if (this.battleDismissTimer) clearTimeout(this.battleDismissTimer);
    });
  }

  protected onSpotClicked(spot: Spot): void {
    const selectedId = this.selectedPokemonId();

    if (selectedId && this.validMoveTargets().includes(spot.id)) {
      const result = this.gameStore.movePokemon(selectedId, spot.id);
      if (result.success && !result.won) {
        this.gameStore.endTurn();
      }
      return;
    }

    const pokemonAtSpot = this.pokemonOnBoard().find((p) => p.spotId === spot.id);
    if (pokemonAtSpot && pokemonAtSpot.playerId === this.currentPlayerId()) {
      this.gameStore.selectPokemon(pokemonAtSpot.id);
    }
  }

  protected onPokemonClicked(pokemon: Pokemon): void {
    if (pokemon.playerId === this.currentPlayerId() && this.phase() !== 'ended') {
      this.gameStore.selectPokemon(pokemon.id);
    }
  }

  protected onBenchPokemonSelected(pokemon: Pokemon): void {
    if (pokemon.playerId === this.currentPlayerId() && this.phase() !== 'ended') {
      this.gameStore.selectPokemon(pokemon.id);
    }
  }

  protected skipTurn(): void {
    this.gameStore.clearSelection();
    this.gameStore.clearBattle();
    this.gameStore.endTurn();
  }

  protected resetGame(): void {
    this.gameStore.resetGame();
    this.gameStore.setupInitialPokemon();
  }

  protected dismissBattle(): void {
    if (this.battleDismissTimer) {
      clearTimeout(this.battleDismissTimer);
      this.battleDismissTimer = null;
    }
    this.showBattle.set(false);
    this.gameStore.clearBattle();
  }
}
