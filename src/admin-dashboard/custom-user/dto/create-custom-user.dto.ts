import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCustomUserDto {
  @ApiProperty({ example: 'John Doe', description: 'Full name of the user' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'Email address of the user',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: '123-456-7890',
    description: 'Phone number of the user',
    required: false,
  })
  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @ApiProperty({
    example: 'Acme Corp',
    description: 'Company name of the user',
    required: false,
  })
  @IsString()
  @IsOptional()
  companyName?: string;

  @ApiProperty({
    example: '123 Main St, Anytown, USA',
    description: 'Address of the user',
    required: false,
  })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({
    example: 'USER',
    description: 'Role of the user',
  })
  @IsString()
  @IsNotEmpty()
  userRole: string;

  @ApiProperty({
    example: true,
    description: 'Account status of the user',
    required: false,
  })
  @IsOptional()
  accountStatus?: boolean;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Subscription plan of the user',
    required: false,
  })
  @IsString()
  @IsOptional()
  subscriptionPlan?: string;
}
