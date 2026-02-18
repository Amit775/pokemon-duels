import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'lobby',
    pathMatch: 'full',
  },
  {
    path: 'board-creator',
    loadComponent: () =>
      import('./containers/board-creator/board-creator.component').then(
        (m) => m.BoardCreatorComponent,
      ),
  },
  {
    path: 'lobby',
    loadComponent: () =>
      import('./containers/lobby/lobby.component').then((m) => m.LobbyComponent),
  },
  {
    path: 'play',
    loadComponent: () =>
      import('./containers/game-board/game-board.component').then((m) => m.GameBoardComponent),
  },
  {
    path: 'play/:roomId',
    loadComponent: () =>
      import('./containers/multiplayer-game/multiplayer-game.component').then(
        (m) => m.MultiplayerGameComponent,
      ),
  },
];

