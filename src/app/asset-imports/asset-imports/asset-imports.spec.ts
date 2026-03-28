import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssetImports } from './asset-imports';

describe('AssetImports', () => {
  let component: AssetImports;
  let fixture: ComponentFixture<AssetImports>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssetImports]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssetImports);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
