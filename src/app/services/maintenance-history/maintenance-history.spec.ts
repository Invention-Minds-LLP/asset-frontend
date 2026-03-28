import { TestBed } from '@angular/core/testing';

import { MaintenanceHistory } from './maintenance-history';

describe('MaintenanceHistory', () => {
  let service: MaintenanceHistory;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MaintenanceHistory);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
