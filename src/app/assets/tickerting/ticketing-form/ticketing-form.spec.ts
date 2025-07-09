import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TickertingForm } from './ticketing-form';

describe('TickertingForm', () => {
  let component: TickertingForm;
  let fixture: ComponentFixture<TickertingForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TickertingForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TickertingForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
