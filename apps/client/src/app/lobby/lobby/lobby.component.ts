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
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-lobby',
  standalone: true,
  imports: [
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './lobby.component.html',
  styleUrl: './lobby.component.scss',
})
export class LobbyComponent implements OnDestroy {
  private readonly router = inject(Router);
  private readonly multiplayerService = inject(MultiplayerService);
  private readonly signalRService = inject(SignalRService);
  private readonly store = inject(MultiplayerStore);

  protected readonly joinCode = signal('');

  protected readonly roomState = this.store.roomState;
  protected readonly roomCode = this.store.roomCode;
  protected readonly localPlayerId = this.store.localPlayerId;
  protected readonly opponentConnected = this.store.opponentConnected;
  protected readonly error = this.store.error;
  protected readonly connectionState = this.signalRService.connectionState;

  protected readonly isLoading = this.store.isLoading;
  protected readonly isWaiting = this.store.isWaiting;
  protected readonly isInRoom = this.store.isInRoom;

  constructor() {
    effect(() => {
      if (this.roomState() === 'playing' && this.roomCode()) {
        this.navigateToGame();
      }
    });
  }

  ngOnDestroy(): void {}

  protected async createRoom(): Promise<void> {
    await this.multiplayerService.createRoom();
  }

  protected async joinRoom(): Promise<void> {
    const code = this.joinCode().trim().toUpperCase();
    if (!code) return;

    const success = await this.multiplayerService.joinRoom(code);
    if (success) {
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
