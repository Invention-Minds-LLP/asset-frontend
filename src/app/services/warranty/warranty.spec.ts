import { TestBed } from '@angular/core/testing';

import { Warranty } from './warranty';

describe('Warranty', () => {
  let service: Warranty;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Warranty);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
