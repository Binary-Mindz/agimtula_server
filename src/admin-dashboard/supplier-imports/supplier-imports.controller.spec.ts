import { Test, TestingModule } from '@nestjs/testing';
import { SupplierImportsController } from './supplier-imports.controller';
import { SupplierImportsService } from './supplier-imports.service';

describe('SupplierImportsController', () => {
  let controller: SupplierImportsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SupplierImportsController],
      providers: [SupplierImportsService],
    }).compile();

    controller = module.get<SupplierImportsController>(SupplierImportsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
