// src/auth/dto/revoke-user-module.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

export class RevokeUserModuleDto {
  @ApiProperty({
    description: 'User ID from whom the module access will be revoked',
    example: '49be3355-4a41-492a-bfa8-199adffa3107',
  })
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @ApiProperty({
    description: 'Module name to revoke from the user',
    example: 'quotations',
  })
  @IsNotEmpty()
  @IsString()
  moduleName: string;
}
