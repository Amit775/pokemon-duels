import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter, Router } from '@angular/router';
import { signal } from '@angular/core';
import { LobbyComponent } from './lobby.component';
import { MultiplayerService } from '../../multiplayer/multiplayer.service';
import { MultiplayerStore } from '../../multiplayer/multiplayer.store';
import { SignalRService } from '../../multiplayer/signalr.service';

describe('LobbyComponent', () => {
  let fixture: ComponentFixture<LobbyComponent>;
  let component: LobbyComponent;
  let store: InstanceType<typeof MultiplayerStore>;
  let router: Router;

  const mockMultiplayerService = {
    createRoom: vi.fn().mockResolvedValue(true),
    joinRoom: vi.fn().mockResolvedValue(true),
    leaveRoom: vi.fn().mockResolvedValue(undefined),
  };

  const mockSignalRService = {
    connectionState: signal<'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error'>('disconnected'),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [LobbyComponent],
      providers: [
        { provide: MultiplayerService, useValue: mockMultiplayerService },
        { provide: SignalRService, useValue: mockSignalRService },
        provideRouter([]),
        provideNoopAnimations(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LobbyComponent);
    component = fixture.componentInstance;
    store = TestBed.inject(MultiplayerStore);
    router = TestBed.inject(Router);
    store.reset(); // ensure clean state for each test
    fixture.detectChanges();
  });

  // ==========================================================================
  // Rendering — idle state
  // ==========================================================================

  describe('rendering — idle state', () => {
    it('renders Create Room button', () => {
      expect(fixture.nativeElement.textContent).toContain('Create Room');
    });

    it('renders Join Room input', () => {
      const input = fixture.nativeElement.querySelector('input[placeholder="ABCD"]');
      expect(input).toBeTruthy();
    });

    it('renders lobby heading', () => {
      const h1 = fixture.nativeElement.querySelector('h1');
      expect(h1?.textContent).toContain('POKEMON DUEL');
    });

    it('renders connection status indicator', () => {
      const status = fixture.nativeElement.querySelector('.connection-pill');
      expect(status).toBeTruthy();
    });

    it('shows Disconnected by default', () => {
      const statusText = fixture.nativeElement.querySelector('.connection-label');
      expect(statusText?.textContent?.trim()).toBe('Disconnected');
    });

    it('shows Connected when connectionState is connected', () => {
      mockSignalRService.connectionState.set('connected');
      fixture.detectChanges();

      const statusText = fixture.nativeElement.querySelector('.connection-label');
      expect(statusText?.textContent?.trim()).toBe('Connected');
    });
  });

  // ==========================================================================
  // Create Room
  // ==========================================================================

  describe('createRoom', () => {
    it('calls multiplayerService.createRoom when Create Room button is clicked', async () => {
      const createBtn = fixture.nativeElement.querySelector('[data-testid="create-room-btn"]') as HTMLElement;
      createBtn.click();
      await fixture.whenStable();

      expect(mockMultiplayerService.createRoom).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // Join Room
  // ==========================================================================

  describe('joinRoom', () => {
    it('Join button is disabled when code is empty', () => {
      const joinButton = fixture.nativeElement.querySelector('[data-testid="join-room-btn"]') as HTMLButtonElement;
      expect(joinButton.disabled).toBe(true);
    });

    it('does not call joinRoom when room code is empty', async () => {
      const joinButton = fixture.nativeElement.querySelector('[data-testid="join-room-btn"]') as HTMLElement;
      joinButton.click();
      await fixture.whenStable();

      expect(mockMultiplayerService.joinRoom).not.toHaveBeenCalled();
    });

    it('calls joinRoom with uppercased code', async () => {
      const input = fixture.nativeElement.querySelector('[data-testid="room-code-input"]') as HTMLInputElement;
      input.value = 'abcd';
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      const joinButton = fixture.nativeElement.querySelector('[data-testid="join-room-btn"]') as HTMLElement;
      joinButton.click();
      await fixture.whenStable();

      expect(mockMultiplayerService.joinRoom).toHaveBeenCalledWith('ABCD');
    });
  });

  // ==========================================================================
  // Waiting Room
  // ==========================================================================

  describe('waiting room', () => {
    beforeEach(() => {
      store.setRoomInfo({ roomId: 'WXYZ', playerCount: 1, players: ['p1'], state: 'waiting' });
      store.setRoomState('waiting');
      store.setLocalPlayerId(1);
      fixture.detectChanges();
    });

    it('shows room code when in waiting state', () => {
      expect(fixture.nativeElement.textContent).toContain('WXYZ');
    });

    it('shows player ID when waiting', () => {
      expect(fixture.nativeElement.textContent).toContain('1');
    });

    it('shows waiting heading', () => {
      expect(fixture.nativeElement.textContent).toContain('Waiting for Opponent');
    });

    it('calls leaveRoom when Leave Room button is clicked', async () => {
      const leaveBtn = fixture.nativeElement.querySelector('[data-testid="leave-room-btn"]') as HTMLElement;
      leaveBtn.click();
      await fixture.whenStable();

      expect(mockMultiplayerService.leaveRoom).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // Navigation
  // ==========================================================================

  describe('navigation', () => {
    it('navigates to game when roomState becomes playing with a room code', () => {
      const navigateSpy = vi.spyOn(router, 'navigate');
      store.setRoomInfo({ roomId: 'PLAY', playerCount: 2, players: ['p1', 'p2'], state: 'playing' });
      store.setRoomState('playing');
      fixture.detectChanges();

      expect(navigateSpy).toHaveBeenCalledWith(['/play', 'PLAY']);
    });

    it('does not navigate when roomState is playing but roomCode is null', () => {
      const navigateSpy = vi.spyOn(router, 'navigate');
      store.setRoomState('playing');
      // No roomInfo set → roomCode is null
      fixture.detectChanges();

      expect(navigateSpy).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // updateJoinCode
  // ==========================================================================

  describe('updateJoinCode', () => {
    it('uppercases the input value and passes it to joinRoom', async () => {
      const input = fixture.nativeElement.querySelector('[data-testid="room-code-input"]') as HTMLInputElement;
      input.value = 'abcd';
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      const joinButton = fixture.nativeElement.querySelector('[data-testid="join-room-btn"]') as HTMLElement;
      joinButton.click();
      await fixture.whenStable();

      expect(mockMultiplayerService.joinRoom).toHaveBeenCalledWith('ABCD');
    });
  });
});
