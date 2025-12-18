import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
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
import { BillingPeriod } from 'prisma/generated/prisma/enums';

class PackagePricingDto {
  @ApiProperty({ example: 49.0, minimum: 0 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price: number;

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

  @ApiProperty({
    enum: BillingPeriod,
    default: BillingPeriod.MONTHLY,
    example: BillingPeriod.MONTHLY,
  })
  @IsEnum(BillingPeriod)
  billingPeriod: BillingPeriod = BillingPeriod.MONTHLY;
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

  @ApiProperty({ type: [PackagePricingDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PackagePricingDto)
  packagePricingDto: PackagePricingDto[] = [];

  @ApiPropertyOptional({ example: 15 })
  @IsNotEmpty()
  @IsInt()
  perMonthInvoiceCount: number;

  @ApiProperty({ type: [String], example: ['id1', 'id2'] })
  @IsArray()
  @IsString({ each: true })
  invoiceAutoSyncIntervalIds: string[];

  @ApiPropertyOptional({
    type: [String],
    example: ['Unlimited invoices', 'Priority support'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  planFeatures?: string[] = [];
}
