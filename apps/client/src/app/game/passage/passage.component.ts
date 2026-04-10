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
  // Percentage converters for responsive layout
  xPercent = input<((x: number) => number) | null>(null);
  yPercent = input<((y: number) => number) | null>(null);

  // Outputs
  passageClicked = output<Passage>();

  // Methods
  protected onClick(): void {
    this.passageClicked.emit(this.passage());
  }

  // Get x coordinate (percentage or pixel)
  protected getX(value: number): string {
    const converter = this.xPercent();
    return converter ? `${converter(value)}%` : `${value}`;
  }

  // Get y coordinate (percentage or pixel)
  protected getY(value: number): string {
    const converter = this.yPercent();
    return converter ? `${converter(value)}%` : `${value}`;
  }
}
