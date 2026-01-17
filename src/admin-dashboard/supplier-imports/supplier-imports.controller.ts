import { Controller, Get } from '@nestjs/common';
import { SupplierImportsService } from './supplier-imports.service';
import { Roles } from 'src/decorators/roles.decorator';
import { ApiOperation } from '@nestjs/swagger';

@Controller('supplier-imports')
export class SupplierImportsController {
  constructor(
    private readonly supplierImportsService: SupplierImportsService,
  ) {}

  @Get('activity')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get supplier activity ( ADMIN only )' })
  async getActivity() {
    return this.supplierImportsService.getActivity();
  }

  @Get('recent-users')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get recent users ( ADMIN only )' })
  async getRecentUsers() {
    return this.supplierImportsService.getRecentUsers();
  }

  @Get('system-logs')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get system logs ( ADMIN only )' })
  async getSystemLogs() {
    return this.supplierImportsService.getSystemLogs();
  }
}
