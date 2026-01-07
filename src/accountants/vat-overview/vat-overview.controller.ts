import { Controller } from '@nestjs/common';
import { VatOverviewService } from './vat-overview.service';

@Controller('vat-overview')
export class VatOverviewController {
  constructor(private readonly vatOverviewService: VatOverviewService) {}
}
