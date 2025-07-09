import { TestBed } from '@angular/core/testing';

import { Ticketing } from './ticketing';

describe('Tickerting', () => {
  let service: Ticketing;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Ticketing);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
