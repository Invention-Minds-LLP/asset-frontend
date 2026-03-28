import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PendingTransfers } from './pending-transfers';

describe('PendingTransfers', () => {
  let component: PendingTransfers;
  let fixture: ComponentFixture<PendingTransfers>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PendingTransfers]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PendingTransfers);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
