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
    path: 'local',
    loadComponent: () =>
      import('./game/local-game/local-game.component').then((m) => m.LocalGameComponent),
  },
  {
    path: 'play/:roomId',
    loadComponent: () =>
      import('./containers/multiplayer-game/multiplayer-game.component').then(
        (m) => m.MultiplayerGameComponent,
      ),
  },
];

