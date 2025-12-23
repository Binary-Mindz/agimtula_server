import { Module } from '@nestjs/common';
import { SupplierImportsService } from './supplier-imports.service';
import { SupplierImportsController } from './supplier-imports.controller';

@Module({
  controllers: [SupplierImportsController],
  providers: [SupplierImportsService],
})
export class SupplierImportsModule {}
