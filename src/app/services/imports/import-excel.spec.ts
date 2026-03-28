import { TestBed } from '@angular/core/testing';

import { ImportExcel } from './import-excel';

describe('ImportExcel', () => {
  let service: ImportExcel;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ImportExcel);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
