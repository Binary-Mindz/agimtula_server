import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class InvoiceLayoutDto {
  @ApiPropertyOptional({
    description: 'Prefix for invoice numbers (e.g., INV-, FACT-)',
    example: 'INV-',
    maxLength: 10,
  })
  @IsOptional()
  @IsString()
  @MaxLength(10, { message: 'Invoice prefix cannot exceed 10 characters' })
  invoice_prefix?: string;

  @ApiPropertyOptional({
    description: 'Prefix for quote numbers (e.g., QUO-, EST-)',
    example: 'QUO-',
    maxLength: 10,
  })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  quote_prefix?: string;

  @ApiPropertyOptional({
    description: 'Year format in invoice/quote numbers',
    example: 'YY',
    enum: ['YYYY', 'YY', null],
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(4)
  year_format?: string | null;

  // Tax Settings

  @ApiPropertyOptional({
    description: 'Default VAT/TAX rate in percent (e.g., 21 for 21%)',
    example: 21,
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  default_vat_rate?: number | null;

  @ApiPropertyOptional({
    description: 'Show tax breakdown on invoices/quotes',
    example: true,
    default: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  tax_breakdown?: boolean;

  @ApiPropertyOptional({
    description: 'Prices on invoices include tax by default',
    example: false,
    default: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  prices_include_tax?: boolean;

  // Invoice Template

  @ApiPropertyOptional({
    description: 'Custom title on invoices (e.g., Tax Invoice, Credit Note)',
    example: 'Tax Invoice',
  })
  @IsOptional()
  @IsString()
  template_title?: string | null;

  @ApiPropertyOptional({
    description: 'Show company logo on invoices and quotes',
    example: true,
    default: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  show_company_logo?: boolean;

  // Default Notes & Terms

  @ApiPropertyOptional({
    description: 'Default notes added to all invoices',
    example: 'Payment due within 14 days. Thank you for your business!',
  })
  @IsOptional()
  @IsString()
  invoice_notes?: string | null;

  @ApiPropertyOptional({
    description: 'Default terms and conditions',
    example: 'Goods remain property of seller until fully paid...',
  })
  @IsOptional()
  @IsString()
  terms_and_conditions?: string | null;
}
