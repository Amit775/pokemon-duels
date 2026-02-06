import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import {
  BoardStore,
  BoardService,
  Spot,
  Passage,
  createSpot,
  createPassage,
  snapPointToGrid,
} from '@pokemon-duel/board';
import { SpotComponent } from '../spot/spot.component';
import { PassageComponent } from '../passage/passage.component';

const DEFAULT_CELL_SIZE = 50;

@Component({
  selector: 'app-board-canvas',
  standalone: true,
  imports: [SpotComponent, PassageComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './board-canvas.component.html',
  styleUrl: './board-canvas.component.scss',
})
export class BoardCanvasComponent {
  protected readonly store = inject(BoardStore);
  private readonly boardService = inject(BoardService);

  protected readonly cellSize = DEFAULT_CELL_SIZE;

  // Computed: resolve passages to their connected spots
  protected readonly passagesWithSpots = computed(() => {
    const spots = this.store.spotEntities();
    const passages = this.store.passageEntities();

    return passages
      .map((passage) => {
        const fromSpot = spots.find((s) => s.id === passage.fromSpotId);
        const toSpot = spots.find((s) => s.id === passage.toSpotId);
        if (!fromSpot || !toSpot) return null;
        return { passage, fromSpot, toSpot };
      })
      .filter((p): p is { passage: Passage; fromSpot: Spot; toSpot: Spot } => p !== null);
  });

  // ==========================================================================
  // Event Handlers
  // ==========================================================================

  onCanvasClick(event: MouseEvent): void {
    // Only handle clicks directly on the canvas, not on child elements
    if (event.target !== event.currentTarget) return;

    const mode = this.store.editingMode();

    if (mode === 'add-spot') {
      this.addSpotAtPosition(event.offsetX, event.offsetY);
    }
  }

  onSpotClicked(spot: Spot): void {
    const mode = this.store.editingMode();

    switch (mode) {
      case 'select':
        this.store.selectSpot(spot.id);
        break;

      case 'add-passage':
        this.handlePassageCreation(spot);
        break;

      case 'delete':
        this.store.deleteSpot(spot.id);
        break;
    }
  }

  onPassageClicked(passage: Passage): void {
    const mode = this.store.editingMode();

    switch (mode) {
      case 'select':
        this.store.selectPassage(passage.id);
        break;

      case 'delete':
        this.store.deletePassage(passage.id);
        break;
    }
  }

  // ==========================================================================
  // Helper Methods
  // ==========================================================================

  private addSpotAtPosition(x: number, y: number): void {
    const snapped = snapPointToGrid(x, y, this.cellSize, this.store.gridSnapEnabled());
    const spotType = this.store.newSpotType();
    const playerId = this.store.newSpotPlayerId();

    let metadata: Spot['metadata'];
    if (spotType === 'entry') {
      metadata = { type: 'entry', playerId };
    } else if (spotType === 'flag') {
      metadata = { type: 'flag', playerId };
    } else {
      metadata = { type: 'normal' };
    }

    const newSpot = createSpot({
      id: this.boardService.generateId(),
      x: snapped.x,
      y: snapped.y,
      metadata,
    });

    this.store.addSpot(newSpot);
  }

  private handlePassageCreation(spot: Spot): void {
    const sourceId = this.store.passageSourceSpotId();

    if (!sourceId) {
      // First click: set source
      this.store.setPassageSource(spot.id);
    } else if (sourceId !== spot.id) {
      // Second click: create passage
      const newPassage = createPassage({
        id: this.boardService.generateId(),
        fromSpotId: sourceId,
        toSpotId: spot.id,
        passageType: this.store.newPassageType(),
      });

      this.store.addPassage(newPassage);
      this.store.setPassageSource(null);
    }
    // If clicking the same spot, do nothing (user can click elsewhere to cancel)
  }

  // Track functions for @for
  protected trackSpot(_index: number, spot: Spot): string {
    return spot.id;
  }

  protected trackPassage(
    _index: number,
    item: { passage: Passage; fromSpot: Spot; toSpot: Spot }
  ): string {
    return item.passage.id;
  }
}
