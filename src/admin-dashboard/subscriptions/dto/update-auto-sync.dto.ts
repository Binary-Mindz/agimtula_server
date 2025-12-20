import { PartialType } from '@nestjs/swagger';
import { InvoiceAutoSyncDto } from './invoiceAutoSyncDto';

export class UpdateAutoSyncDto extends PartialType(InvoiceAutoSyncDto) {}
