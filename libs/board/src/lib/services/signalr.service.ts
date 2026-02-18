import { Injectable, signal, computed, inject, OnDestroy, Optional } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { BOARD_CONFIG, DEFAULT_BOARD_CONFIG } from '../config/board.config';

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';

type EventHandler = { eventName: string; callback: (data: unknown) => void };

/**
 * Service for managing SignalR connection to game server
 */
@Injectable({
  providedIn: 'root'
})
export class SignalRService implements OnDestroy {
  private connection: signalR.HubConnection | null = null;
  private pendingHandlers: EventHandler[] = [];
  private readonly config = inject(BOARD_CONFIG, { optional: true }) ?? DEFAULT_BOARD_CONFIG;
  
  // Connection state
  private readonly _connectionState = signal<ConnectionState>('disconnected');
  private readonly _error = signal<string | null>(null);
  
  readonly connectionState = this._connectionState.asReadonly();
  readonly error = this._error.asReadonly();
  readonly isConnected = computed(() => this._connectionState() === 'connected');
  
  // Server URL - from configuration
  private get serverUrl(): string {
    return this.config.signalRUrl;
  }

  ngOnDestroy(): void {
    this.disconnect();
  }

  /**
   * Connect to the SignalR hub
   */
  async connect(): Promise<boolean> {
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      return true;
    }

    try {
      this._connectionState.set('connecting');
      this._error.set(null);

      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(this.serverUrl)
        .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
        .configureLogging(signalR.LogLevel.Information)
        .build();

      // Setup connection state handlers
      this.connection.onreconnecting(() => {
        this._connectionState.set('reconnecting');
      });

      this.connection.onreconnected(() => {
        this._connectionState.set('connected');
      });

      this.connection.onclose(() => {
        this._connectionState.set('disconnected');
      });

      // Apply any pending event handlers
      for (const handler of this.pendingHandlers) {
        this.connection.on(handler.eventName, handler.callback);
      }

      await this.connection.start();
      this._connectionState.set('connected');
      console.log('SignalR connected');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect';
      this._error.set(errorMessage);
      this._connectionState.set('error');
      console.error('SignalR connection error:', err);
      return false;
    }
  }

  /**
   * Disconnect from the hub
   */
  async disconnect(): Promise<void> {
    if (this.connection) {
      try {
        await this.connection.stop();
      } catch (err) {
        console.error('Error disconnecting:', err);
      }
      this.connection = null;
      this._connectionState.set('disconnected');
    }
  }

  /**
   * Invoke a hub method and return the result
   */
  async invoke<T>(methodName: string, ...args: unknown[]): Promise<T> {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      throw new Error('Not connected to server');
    }
    return await this.connection.invoke<T>(methodName, ...args);
  }

  /**
   * Send a message without expecting a return value
   */
  async send(methodName: string, ...args: unknown[]): Promise<void> {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      throw new Error('Not connected to server');
    }
    await this.connection.send(methodName, ...args);
  }

  /**
   * Register an event handler
   */
  on<T>(eventName: string, callback: (data: T) => void): void {
    // Store for later if connection doesn't exist yet
    this.pendingHandlers.push({ eventName, callback: callback as (data: unknown) => void });
    
    // Also apply immediately if connection exists
    this.connection?.on(eventName, callback);
  }

  /**
   * Remove an event handler
   */
  off(eventName: string, callback?: (...args: unknown[]) => void): void {
    // Remove from pending handlers
    this.pendingHandlers = this.pendingHandlers.filter(h => h.eventName !== eventName);
    
    if (callback) {
      this.connection?.off(eventName, callback);
    } else {
      this.connection?.off(eventName);
    }
  }
}
