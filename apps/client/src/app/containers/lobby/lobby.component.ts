import { 
  Component, 
  inject, 
  signal, 
  computed, 
  ChangeDetectionStrategy,
  OnDestroy,
  effect
} from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MultiplayerService, SignalRService } from '@pokemon-duel/board';

@Component({
  selector: 'app-lobby',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './lobby.component.html',
  styleUrl: './lobby.component.scss'
})
export class LobbyComponent implements OnDestroy {
  private readonly router = inject(Router);
  private readonly multiplayerService = inject(MultiplayerService);
  private readonly signalRService = inject(SignalRService);
  
  // Local form state
  protected readonly joinCode = signal('');
  
  // State from services
  protected readonly roomState = this.multiplayerService.roomState;
  protected readonly roomCode = this.multiplayerService.roomCode;
  protected readonly localPlayerId = this.multiplayerService.localPlayerId;
  protected readonly opponentConnected = this.multiplayerService.opponentConnected;
  protected readonly error = this.multiplayerService.error;
  protected readonly connectionState = this.signalRService.connectionState;
  
  // Computed UI states
  protected readonly isLoading = computed(() => {
    const state = this.roomState();
    return state === 'creating' || state === 'joining';
  });
  
  protected readonly isWaiting = computed(() => this.roomState() === 'waiting');
  protected readonly isInRoom = computed(() => {
    const state = this.roomState();
    return state === 'waiting' || state === 'playing';
  });

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
    const success = await this.multiplayerService.createRoom();
    if (success) {
      // Stay on lobby page, showing room code and waiting for opponent
    }
  }

  protected async joinRoom(): Promise<void> {
    const code = this.joinCode().trim().toUpperCase();
    if (!code) return;
    
    const success = await this.multiplayerService.joinRoom(code);
    if (success) {
      // Check if game already started (we might be player 2)
      if (this.multiplayerService.roomState() === 'playing') {
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
