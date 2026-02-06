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
];
