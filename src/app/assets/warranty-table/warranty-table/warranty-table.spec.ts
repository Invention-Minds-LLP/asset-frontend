import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WarrantyTable } from './warranty-table';

describe('WarrantyTable', () => {
  let component: WarrantyTable;
  let fixture: ComponentFixture<WarrantyTable>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WarrantyTable]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WarrantyTable);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
