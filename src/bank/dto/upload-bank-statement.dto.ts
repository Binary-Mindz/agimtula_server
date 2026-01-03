import { ApiProperty } from '@nestjs/swagger';

export class UploadBankStatementDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Bank statement file (MT940 .940 or CAMT.053 .xml)',
  })
  file: Express.Multer.File;
}
