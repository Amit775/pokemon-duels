import {
  Component,
  inject,
  signal,
  ChangeDetectionStrategy,
  OnDestroy,
  effect,
} from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MultiplayerService, MultiplayerStore, SignalRService } from '@pokemon-duel/board';

@Component({
  selector: 'app-lobby',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './lobby.component.html',
  styleUrl: './lobby.component.scss',
})
export class LobbyComponent implements OnDestroy {
  private readonly router = inject(Router);
  private readonly multiplayerService = inject(MultiplayerService);
  private readonly signalRService = inject(SignalRService);

  // Store — single source of truth for all multiplayer state
  private readonly store = inject(MultiplayerStore);

  // Local form state
  protected readonly joinCode = signal('');

  // State from store
  protected readonly roomState = this.store.roomState;
  protected readonly roomCode = this.store.roomCode;
  protected readonly localPlayerId = this.store.localPlayerId;
  protected readonly opponentConnected = this.store.opponentConnected;
  protected readonly error = this.store.error;
  protected readonly connectionState = this.signalRService.connectionState;

  // Computed UI states from store
  protected readonly isLoading = this.store.isLoading;
  protected readonly isWaiting = this.store.isWaiting;
  protected readonly isInRoom = this.store.isInRoom;

  constructor() {
    // Auto-navigate to game when it starts
    effect(() => {
      if (this.roomState() === 'playing' && this.roomCode()) {
        this.navigateToGame();
      }
    });
  }

  ngOnDestroy(): void {
    // Don't leave room on destroy - we might be navigating to the game
  }

  protected async createRoom(): Promise<void> {
    await this.multiplayerService.createRoom();
  }

  protected async joinRoom(): Promise<void> {
    const code = this.joinCode().trim().toUpperCase();
    if (!code) return;

    const success = await this.multiplayerService.joinRoom(code);
    if (success) {
      // Check if game already started (we might be player 2)
      if (this.store.roomState() === 'playing') {
        this.navigateToGame();
      }
    }
  }

  protected async leaveRoom(): Promise<void> {
    await this.multiplayerService.leaveRoom();
    this.joinCode.set('');
  }

  protected navigateToGame(): void {
    const code = this.roomCode();
    if (code) {
      this.router.navigate(['/play', code]);
    }
  }

  protected copyRoomCode(): void {
    const code = this.roomCode();
    if (code) {
      navigator.clipboard.writeText(code);
    }
  }

  protected updateJoinCode(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.joinCode.set(input.value.toUpperCase());
  }
}
