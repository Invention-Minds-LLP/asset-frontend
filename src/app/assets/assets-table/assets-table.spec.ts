import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssetsTable } from './assets-table';

describe('AssetsTable', () => {
  let component: AssetsTable;
  let fixture: ComponentFixture<AssetsTable>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssetsTable]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssetsTable);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
