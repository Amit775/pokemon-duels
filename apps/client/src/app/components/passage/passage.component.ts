import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
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

  // Methods
  protected onClick(): void {
    this.passageClicked.emit(this.passage());
  }
}
