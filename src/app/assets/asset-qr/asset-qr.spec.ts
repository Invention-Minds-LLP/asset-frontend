import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssetQr } from './asset-qr';

describe('AssetQr', () => {
  let component: AssetQr;
  let fixture: ComponentFixture<AssetQr>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssetQr]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssetQr);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
