import { Controller } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { urlPrefix } from '../url-prefix';

@Controller(`${urlPrefix}reports`)
export class UserReportsController {
  constructor(private readonly reportsService: ReportsService) {}
}
