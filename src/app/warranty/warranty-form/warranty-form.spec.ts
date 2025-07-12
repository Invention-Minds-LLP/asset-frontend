import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WarrantyForm } from './warranty-form';

describe('WarrantyForm', () => {
  let component: WarrantyForm;
  let fixture: ComponentFixture<WarrantyForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WarrantyForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WarrantyForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
