import { Controller, Get } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { urlPrefix } from '../url-prefix';

@Controller(`${urlPrefix}/dashboard`)
export class AdminDashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @Roles('ADMIN')
  async getData() {
    return await this.dashboardService.getData();
  }
}
