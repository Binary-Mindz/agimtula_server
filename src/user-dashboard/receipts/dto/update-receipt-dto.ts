import { PartialType } from '@nestjs/swagger';
import { UploadReceiptDto } from './upload-receipt.dto';

export class UpdateReceiptDto extends PartialType(UploadReceiptDto) {}
