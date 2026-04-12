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
  public passage = input.required<Passage>();
  public fromSpot = input.required<Spot>();
  public toSpot = input.required<Spot>();
  public selected = input(false);
  // Percentage converters for responsive layout
  public xPercent = input<((x: number) => number) | null>(null);
  public yPercent = input<((y: number) => number) | null>(null);

  public passageClicked = output<Passage>();

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
