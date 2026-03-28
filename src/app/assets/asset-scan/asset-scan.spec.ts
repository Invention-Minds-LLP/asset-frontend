import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssetScan } from './asset-scan';

describe('AssetScan', () => {
  let component: AssetScan;
  let fixture: ComponentFixture<AssetScan>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssetScan]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssetScan);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
