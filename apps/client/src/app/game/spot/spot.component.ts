import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { Spot } from '@pokemon-duel/board';

@Component({
  selector: 'app-spot',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './spot.component.html',
  styleUrl: './spot.component.scss',
})
export class SpotComponent {
  public spot = input.required<Spot>();
  public selected = input(false);
  // Percentage-based positioning for responsive layout
  public xPercent = input<number | null>(null);
  public yPercent = input<number | null>(null);

  public spotClicked = output<Spot>();

  protected readonly spotType = computed(() => this.spot().metadata.type);
  protected readonly playerId = computed(() => {
    const metadata = this.spot().metadata;
    return 'playerId' in metadata ? metadata.playerId : null;
  });
  protected readonly spotClasses = computed(() => {
    const classes = [`spot--${this.spotType()}`];
    const pid = this.playerId();
    if (pid !== null) {
      classes.push(`spot--player-${pid}`);
    }
    return classes.join(' ');
  });

  // Position with units - use percentage if provided, otherwise pixels
  protected readonly positionLeft = computed(() => {
    const percent = this.xPercent();
    return percent !== null ? `${percent}%` : `${this.spot().x}px`;
  });

  protected readonly positionTop = computed(() => {
    const percent = this.yPercent();
    return percent !== null ? `${percent}%` : `${this.spot().y}px`;
  });

  protected onClick(): void {
    this.spotClicked.emit(this.spot());
  }
}
