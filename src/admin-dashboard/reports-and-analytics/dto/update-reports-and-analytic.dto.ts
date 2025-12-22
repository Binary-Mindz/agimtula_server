import { PartialType } from '@nestjs/swagger';
import { CreateReportsAndAnalyticDto } from './create-reports-and-analytic.dto';

export class UpdateReportsAndAnalyticDto extends PartialType(CreateReportsAndAnalyticDto) {}
