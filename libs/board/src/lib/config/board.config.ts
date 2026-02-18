import { InjectionToken } from '@angular/core';

export interface BoardConfig {
  signalRUrl: string;
}

export const BOARD_CONFIG = new InjectionToken<BoardConfig>('BOARD_CONFIG');

export const DEFAULT_BOARD_CONFIG: BoardConfig = {
  signalRUrl: 'http://localhost:5100/gamehub'
};
