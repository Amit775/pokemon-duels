import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'lobby',
    pathMatch: 'full',
  },
  {
    path: 'lobby',
    loadComponent: () =>
      import('./lobby/lobby/lobby.component').then((m) => m.LobbyComponent),
  },
  {
    path: 'local',
    loadComponent: () =>
      import('./game/local-game/local-game.component').then((m) => m.LocalGameComponent),
  },
  {
    path: 'play/:roomId',
    loadComponent: () =>
      import('./game/multiplayer-game/multiplayer-game.component').then(
        (m) => m.MultiplayerGameComponent,
      ),
  },
  {
    path: 'board-creator',
    loadComponent: () =>
      import('./board-editor/board-creator/board-creator.component').then(
        (m) => m.BoardCreatorComponent,
      ),
  },
];
