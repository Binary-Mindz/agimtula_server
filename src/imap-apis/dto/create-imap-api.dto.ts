import { ApiProperty } from '@nestjs/swagger';

export class CreateImapApiDto {
  @ApiProperty({ example: 'uforcode123@gmail.com' })
  email: string;
}
