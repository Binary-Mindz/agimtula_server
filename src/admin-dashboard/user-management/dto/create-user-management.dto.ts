import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

// there will be firstName lastName email phone company name address
export class CreateUserManagementDto {
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
    example: '1234567890',
    description: "User's phone number here",
    required: false,
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({
    example: 'ABC Company',
    description: "User's company name here",
    required: false,
  })
  @IsString()
  @IsOptional()
  company: string;

  @ApiProperty({
    example: '123 Main St, City, Country',
    description: "User's address here",
    required: false,
  })
  @IsString()
  @IsOptional()
  address: string;

  @ApiProperty({
    example: 'USER',
    description: "User's role here",
    required: false,
  })
  @IsString()
  @IsOptional()
  role: 'USER' | 'ACCOUNTANT';

  @ApiProperty({
    example: true,
    description: 'User is active or not',
    required: true,
    default: true,
  })
  @IsBoolean()
  @IsNotEmpty()
  isActive: boolean;
}
