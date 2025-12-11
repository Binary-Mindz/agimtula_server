import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export enum BillingPeriod {
  MONTHLY = 'Monthly',
  YEARLY = 'Yearly',
}

class UsageLimitsDto {
  @ApiPropertyOptional({ example: null, nullable: true })
  @IsOptional()
  @Transform(({ value }) =>
    value === '' || value == null ? null : Number(value),
  )
  @IsInt()
  @Min(0)
  maxInvoicesPerMonth?: number | null;

  @ApiPropertyOptional({ example: null, nullable: true })
  @IsOptional()
  @Transform(({ value }) =>
    value === '' || value == null ? null : Number(value),
  )
  @IsInt()
  @Min(0)
  maxReceiptsPerMonth?: number | null;

  @ApiPropertyOptional({ example: null, nullable: true })
  @IsOptional()
  @Transform(({ value }) =>
    value === '' || value == null ? null : Number(value),
  )
  @IsInt()
  @Min(0)
  maxClients?: number | null;
}

export class CreateSubscriptionPlanDto {
  @ApiProperty({ example: 'Professional' })
  @IsNotEmpty()
  @IsString()
  planName: string;

  @ApiProperty({ example: true, default: true })
  @IsBoolean()
  isActive: boolean = true;

  @ApiPropertyOptional({ example: 'Perfect for freelancers' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 49.0, minimum: 0 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  monthlyPrice: number;

  @ApiProperty({ example: 0 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  setupFee: number = 0;

  @ApiPropertyOptional({ example: 14 })
  @IsOptional()
  @IsInt()
  @Min(0)
  freeTrialDays?: number;

  @ApiProperty({ enum: BillingPeriod, default: BillingPeriod.MONTHLY })
  @IsEnum(BillingPeriod)
  billingPeriod: BillingPeriod = BillingPeriod.MONTHLY;

  @ApiProperty({ type: UsageLimitsDto })
  @ValidateNested()
  @Type(() => UsageLimitsDto)
  usageLimits: UsageLimitsDto = new UsageLimitsDto();

  @ApiPropertyOptional({
    type: [String],
    example: ['Unlimited invoices', 'Priority support'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[] = [];
}
