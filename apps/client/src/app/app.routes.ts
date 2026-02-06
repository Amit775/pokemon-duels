import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'board-creator',
    pathMatch: 'full',
  },
  {
    path: 'board-creator',
    loadComponent: () =>
      import('./containers/board-creator/board-creator.component').then(
        (m) => m.BoardCreatorComponent
      ),
  },
  {
    path: 'play',
    loadComponent: () =>
      import('./containers/game-board/game-board.component').then(
        (m) => m.GameBoardComponent
      ),
  },
];
