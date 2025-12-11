import { TestBed } from '@angular/core/testing';

import { Transferr } from './transferr';

describe('Transferr', () => {
  let service: Transferr;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Transferr);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
