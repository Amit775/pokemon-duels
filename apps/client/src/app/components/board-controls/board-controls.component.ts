import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { BoardStore, BoardService, EditingMode, createBoard } from '@pokemon-duel/board';

@Component({
  selector: 'app-board-controls',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './board-controls.component.html',
  styleUrl: './board-controls.component.scss',
})
export class BoardControlsComponent {
  protected readonly store = inject(BoardStore);
  private readonly boardService = inject(BoardService);

  // ==========================================================================
  // Mode Selection
  // ==========================================================================

  setMode(mode: EditingMode): void {
    this.store.setEditingMode(mode);
  }

  // ==========================================================================
  // Grid Toggle
  // ==========================================================================

  toggleGridSnap(): void {
    this.store.toggleGridSnap();
  }

  // ==========================================================================
  // Persistence
  // ==========================================================================

  saveBoard(): void {
    const board = createBoard({
      id: this.boardService.generateId(),
      name: 'Board',
      spots: this.store.spotEntities(),
      passages: this.store.passageEntities(),
    });
    this.boardService.saveBoard(board);
  }

  loadBoard(): void {
    const board = this.boardService.loadBoard();
    if (board) {
      this.store.reset();
      for (const spot of board.spots) {
        this.store.addSpot(spot);
      }
      for (const passage of board.passages) {
        this.store.addPassage(passage);
      }
    }
  }

  clearBoard(): void {
    this.store.reset();
  }

  // ==========================================================================
  // Export/Import
  // ==========================================================================

  exportBoard(): void {
    const board = createBoard({
      id: this.boardService.generateId(),
      name: 'Board',
      spots: this.store.spotEntities(),
      passages: this.store.passageEntities(),
    });
    const json = this.boardService.exportBoardToJSON(board);

    // Create and trigger download
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'board.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  onImportFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const json = reader.result as string;
        const board = this.boardService.importBoardFromJSON(json);
        this.store.reset();
        for (const spot of board.spots) {
          this.store.addSpot(spot);
        }
        for (const passage of board.passages) {
          this.store.addPassage(passage);
        }
      } catch (e) {
        console.error('Failed to import board:', e);
        alert('Failed to import board. Invalid file format.');
      }
    };
    reader.readAsText(file);

    // Reset the input so the same file can be imported again
    input.value = '';
  }
}
