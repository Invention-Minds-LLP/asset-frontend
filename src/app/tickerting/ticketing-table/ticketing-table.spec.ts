import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TickertingTable } from './ticketing-table';

describe('TickertingTable', () => {
  let component: TickertingTable;
  let fixture: ComponentFixture<TickertingTable>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TickertingTable]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TickertingTable);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
