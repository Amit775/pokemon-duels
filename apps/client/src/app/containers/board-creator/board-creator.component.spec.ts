import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BoardCreatorComponent } from './board-creator.component';

describe('BoardCreatorComponent', () => {
  let component: BoardCreatorComponent;
  let fixture: ComponentFixture<BoardCreatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BoardCreatorComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BoardCreatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render header', () => {
    const header = fixture.nativeElement.querySelector('.board-creator__header h1');
    expect(header?.textContent).toContain('Board Creator');
  });

  it('should render controls', () => {
    const controls = fixture.nativeElement.querySelector('app-board-controls');
    expect(controls).toBeTruthy();
  });

  it('should render canvas', () => {
    const canvas = fixture.nativeElement.querySelector('app-board-canvas');
    expect(canvas).toBeTruthy();
  });
});
