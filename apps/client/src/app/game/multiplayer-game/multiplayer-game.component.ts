import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  linkedSignal,
  OnInit,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Pokemon, Spot } from '@pokemon-duel/board';
import { MultiplayerService } from '../../multiplayer/multiplayer.service';
import { MultiplayerStore } from '../../multiplayer/multiplayer.store';
import { GameBoardComponent } from '../game-board/game-board.component';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-multiplayer-game',
  standalone: true,
  imports: [GameBoardComponent, MatButtonModule, MatChipsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './multiplayer-game.component.html',
  styleUrl: './multiplayer-game.component.scss',
})
export class MultiplayerGameComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly multiplayer = inject(MultiplayerService);
  private readonly store = inject(MultiplayerStore);

  protected readonly roomCode = this.store.roomCode;
  protected readonly localPlayerId = this.store.localPlayerId;
  protected readonly isMyTurn = this.store.isMyTurn;
  protected readonly currentPlayerId = this.store.currentPlayerId;
  protected readonly selectedPokemonId = this.store.selectedPokemonId;
  protected readonly validMoveTargets = this.store.validMoveTargets;
  protected readonly phase = this.store.phase;
  protected readonly winnerId = this.store.winnerId;
  protected readonly lastBattle = this.store.lastBattle;
  protected readonly spots = this.store.spots;
  protected readonly passages = this.store.passages;

  protected readonly pokemonOnBoard = computed(() =>
    this.store.pokemon().filter((p) => p.spotId !== null),
  );
  protected readonly player1Bench = computed(() =>
    this.store.pokemon().filter((p) => p.playerId === 1 && p.spotId === null),
  );
  protected readonly player2Bench = computed(() =>
    this.store.pokemon().filter((p) => p.playerId === 2 && p.spotId === null),
  );

  protected readonly localPlayerWon = computed(() => {
    const winner = this.winnerId();
    const local = this.localPlayerId();
    return winner !== null && winner === local;
  });

  // Tracks lastBattle from the store but can be dismissed locally without a network call
  protected readonly displayBattle = linkedSignal(() => this.store.lastBattle());

  private readonly roomStateEffect = effect(() => {
    if (this.store.roomState() === 'idle') {
      this.router.navigate(['/lobby']);
    }
  });

  ngOnInit(): void {
    const roomId = this.route.snapshot.paramMap.get('roomId');
    if (roomId && !this.roomCode()) {
      this.multiplayer.joinRoom(roomId);
    }
  }

  protected async onSpotClicked(spot: Spot): Promise<void> {
    if (!this.isMyTurn()) return;

    const selectedId = this.selectedPokemonId();
    if (selectedId && this.validMoveTargets().includes(spot.id)) {
      await this.multiplayer.movePokemon(selectedId, spot.id);
      return;
    }

    const pokemonAtSpot = this.pokemonOnBoard().find((p) => p.spotId === spot.id);
    if (pokemonAtSpot && pokemonAtSpot.playerId === this.localPlayerId()) {
      await this.multiplayer.selectPokemon(pokemonAtSpot.id);
    }
  }

  protected async onPokemonClicked(pokemon: Pokemon): Promise<void> {
    if (!this.isMyTurn()) return;
    if (pokemon.playerId === this.localPlayerId() && this.phase() !== 'ended') {
      await this.multiplayer.selectPokemon(pokemon.id);
    }
  }

  protected async onBenchPokemonSelected(pokemon: Pokemon): Promise<void> {
    if (!this.isMyTurn()) return;
    if (pokemon.playerId === this.localPlayerId() && this.phase() !== 'ended') {
      await this.multiplayer.selectPokemon(pokemon.id);
    }
  }

  private async skipTurn(): Promise<void> {
    await this.multiplayer.selectPokemon(null);
  }

  protected returnToLobby(): void {
    this.multiplayer.leaveRoom();
    this.router.navigate(['/lobby']);
  }
}
