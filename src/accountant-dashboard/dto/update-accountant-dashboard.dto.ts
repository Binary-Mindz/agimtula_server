import { PartialType } from '@nestjs/swagger';
import { CreateAccountantDashboardDto } from './create-accountant-dashboard.dto';

export class UpdateAccountantDashboardDto extends PartialType(CreateAccountantDashboardDto) {}
