import { TestBed } from '@angular/core/testing';

import { Assets } from './assets';

describe('Assets', () => {
  let service: Assets;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Assets);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
