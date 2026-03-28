import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SlaMatrix } from './sla-matrix';

describe('SlaMatrix', () => {
  let component: SlaMatrix;
  let fixture: ComponentFixture<SlaMatrix>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SlaMatrix]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SlaMatrix);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
