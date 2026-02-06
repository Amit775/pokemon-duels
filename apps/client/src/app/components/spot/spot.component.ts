import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { Spot, isEntrySpot, isFlagSpot } from '@pokemon-duel/board';

@Component({
  selector: 'app-spot',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './spot.component.html',
  styleUrl: './spot.component.scss',
})
export class SpotComponent {
  // Inputs
  spot = input.required<Spot>();
  selected = input(false);

  // Outputs
  spotClicked = output<Spot>();

  // Computed
  protected spotType = computed(() => this.spot().metadata.type);
  protected playerId = computed(() => {
    const metadata = this.spot().metadata;
    if (isEntrySpot(metadata) || isFlagSpot(metadata)) {
      return metadata.playerId;
    }
    return null;
  });

  // Methods
  protected onClick(): void {
    this.spotClicked.emit(this.spot());
  }
}
