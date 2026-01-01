import { Test, TestingModule } from '@nestjs/testing';
import { SupplierImportsService } from './supplier-imports.service';

describe('SupplierImportsService', () => {
  let service: SupplierImportsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SupplierImportsService],
    }).compile();

    service = module.get<SupplierImportsService>(SupplierImportsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
