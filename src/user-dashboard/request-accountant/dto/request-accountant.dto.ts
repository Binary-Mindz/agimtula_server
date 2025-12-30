import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RequestAccountant {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: 'purpose for requesting accountant',
  })
  purpose: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    example: 'description for requesting accountant',
  })
  description?: string;
}
