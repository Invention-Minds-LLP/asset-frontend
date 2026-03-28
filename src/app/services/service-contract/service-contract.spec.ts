import { TestBed } from '@angular/core/testing';

import { ServiceContract } from './service-contract';

describe('ServiceContract', () => {
  let service: ServiceContract;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ServiceContract);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
