import { Component, ChangeDetectionStrategy } from '@angular/core';
import { BoardStore, BoardService } from '@pokemon-duel/board';
import { BoardCanvasComponent } from '../../components/board-canvas/board-canvas.component';
import { BoardControlsComponent } from '../../components/board-controls/board-controls.component';

@Component({
  selector: 'app-board-creator',
  standalone: true,
  imports: [BoardCanvasComponent, BoardControlsComponent],
  providers: [BoardStore, BoardService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './board-creator.component.html',
  styleUrl: './board-creator.component.scss',
})
export class BoardCreatorComponent {}
