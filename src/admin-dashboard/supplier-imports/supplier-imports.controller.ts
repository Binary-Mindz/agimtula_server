import { Controller } from '@nestjs/common';
import { SupplierImportsService } from './supplier-imports.service';

@Controller('supplier-imports')
export class SupplierImportsController {
  constructor(private readonly supplierImportsService: SupplierImportsService) {}
}
