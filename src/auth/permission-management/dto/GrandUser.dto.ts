import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

export class GrantUserModuleDto {
  @ApiProperty({
    type: 'string',
    description: 'User ID to whom the module access is being granted',
    example: '49be3355-4a41-492a-bfa8-199adffa3107',
  })
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @ApiProperty({
    description: 'Module name that will be granted to the user',
    example: 'quotations',
  })
  @IsNotEmpty()
  @IsString()
  moduleName: string;
}
