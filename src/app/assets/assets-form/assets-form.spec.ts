import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssetsForm } from './assets-form';

describe('AssetsForm', () => {
  let component: AssetsForm;
  let fixture: ComponentFixture<AssetsForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssetsForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssetsForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
