// here will be firstName lastName email businessName? and vat Number? with swagger

import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ProfileSettingsDto {
  @ApiProperty({
    example: 'John Doe',
    description: "User's First name here",
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  firstName: string;
  @ApiProperty({
    example: 'John Doe',
    description: "User's Last name here",
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({
    example: 'john.doe@example.com',
    description: "User's email address here",
    required: true,
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: 'abcd',
    description: 'User business data',
    required: false,
  })
  @IsString()
  @IsOptional()
  businessName?: string;

  @ApiProperty({
    example: '1234567890',
    description: 'User business data',
    required: false,
  })
  @IsString()
  @IsOptional()
  vatNumber?: string;
}
