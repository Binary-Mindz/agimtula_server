import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsEnum,
  IsUUID,
} from 'class-validator';

export enum UserRole {
  FREELANCER = 'Freelancer',
  BUSINESS_OWNER = 'BusinessOwner',
}

export enum AccountStatus {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
}

export class CreateUserDto {
  @ApiProperty({ example: 'John Doe' })
  @IsNotEmpty()
  @IsString()
  fullName: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: '+31 6 1234 5678' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'Acme Inc.' })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiPropertyOptional({
    example: 'Street, City, Postal Code, Country',
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({
    enum: UserRole,
    example: UserRole.FREELANCER,
  })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiProperty({
    enum: AccountStatus,
    example: AccountStatus.ACTIVE,
  })
  @IsEnum(AccountStatus)
  status: AccountStatus;

  @ApiProperty({
    example: 'starter-plan-uuid',
    description: 'Subscription plan ID selected by user',
  })
  @IsUUID()
  subscriptionPlanId: string;
}
