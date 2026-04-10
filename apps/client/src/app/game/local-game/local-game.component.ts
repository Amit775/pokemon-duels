import {
  Component,
  ChangeDetectionStrategy,
  inject,
  computed,
  signal,
  effect,
  OnInit,
  OnDestroy,
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
export class LocalGameComponent implements OnInit, OnDestroy {
  private readonly gameStore = inject(GameStore);
  private readonly boardService = inject(BoardService);

  protected readonly spots = computed(() => this.gameStore.spots());
  protected readonly passages = computed(() => this.gameStore.passages());
  protected readonly pokemonOnBoard = computed(() => this.gameStore.pokemonOnBoard());
  protected readonly player1Bench = computed(() =>
    this.gameStore.benchPokemon().filter((p) => p.playerId === 1),
  );
  protected readonly player2Bench = computed(() =>
    this.gameStore.benchPokemon().filter((p) => p.playerId === 2),
  );
  protected readonly selectedPokemonId = computed(() => this.gameStore.selectedPokemonId());
  protected readonly validMoveTargets = computed(() => this.gameStore.validMoveTargets());
  protected readonly currentPlayerId = computed(() => this.gameStore.currentPlayerId());
  protected readonly phase = computed(() => this.gameStore.phase());
  protected readonly winnerId = computed(() => this.gameStore.winnerId());

  protected readonly showBattle = signal(false);
  protected readonly displayBattle = computed(() =>
    this.showBattle() ? this.gameStore.lastBattle() : null,
  );

  private battleDismissTimer: ReturnType<typeof setTimeout> | null = null;

  private readonly battleEffect = effect(() => {
    const battle = this.gameStore.lastBattle();
    if (battle) {
      this.showBattle.set(true);
      if (this.battleDismissTimer) clearTimeout(this.battleDismissTimer);
      this.battleDismissTimer = setTimeout(() => this.dismissBattle(), 5000);
    } else {
      this.showBattle.set(false);
    }
  });

  ngOnInit(): void {
    const board = this.boardService.loadBoard();
    if (board) {
      this.gameStore.initializeGame(board.spots, board.passages, 2);
      this.gameStore.setupInitialPokemon();
    }
  }

  ngOnDestroy(): void {
    if (this.battleDismissTimer) clearTimeout(this.battleDismissTimer);
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
