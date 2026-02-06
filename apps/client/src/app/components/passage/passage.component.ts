import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { Spot, Passage } from '@pokemon-duel/board';

@Component({
  selector: 'app-passage',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './passage.component.html',
  styleUrl: './passage.component.scss',
})
export class PassageComponent {
  // Inputs
  passage = input.required<Passage>();
  fromSpot = input.required<Spot>();
  toSpot = input.required<Spot>();
  selected = input(false);

  // Outputs
  passageClicked = output<Passage>();

  // Computed for midpoint (cost label position)
  protected midpointX = computed(() => (this.fromSpot().x + this.toSpot().x) / 2);
  protected midpointY = computed(() => (this.fromSpot().y + this.toSpot().y) / 2);

  // Methods
  protected onClick(): void {
    this.passageClicked.emit(this.passage());
  }
}
