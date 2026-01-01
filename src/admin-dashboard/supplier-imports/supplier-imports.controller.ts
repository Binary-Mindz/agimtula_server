import { Controller, Get } from '@nestjs/common';
import { SupplierImportsService } from './supplier-imports.service';
import { Roles } from 'src/auth/decorators/roles.decorator';

@Controller('supplier-imports')
export class SupplierImportsController {
  constructor(
    private readonly supplierImportsService: SupplierImportsService,
  ) {}

  @Get('activity')
  @Roles('ADMIN')
  async getActivity() {
    return this.supplierImportsService.getActivity();
  }

  @Get('recent-users')
  @Roles('ADMIN')
  async getRecentUsers() {
    return this.supplierImportsService.getRecentUsers();
  }
}
