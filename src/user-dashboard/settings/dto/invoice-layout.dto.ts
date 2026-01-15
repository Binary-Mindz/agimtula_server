import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class InvoiceLayoutDto {
  // Invoice numbering
  @ApiPropertyOptional({ example: 'INV' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  invoice_prefix?: string;

  @ApiPropertyOptional({ example: '09898' })
  @IsOptional()
  @IsString()
  lastInvoiceNumber?: string;

  @ApiPropertyOptional({ example: 'Q-' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  quote_prefix?: string;

  @ApiPropertyOptional({ example: 'YYYY' })
  @IsOptional()
  @IsString()
  @MaxLength(4)
  year_format?: string;

  // Vat settings
  @ApiPropertyOptional({ example: 15 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  default_vat_rate?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  vat_breakdown?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  prices_include_vat?: boolean;

  // Invoice template
  @ApiPropertyOptional({ example: 'Vat Invoice' })
  @IsOptional()
  @IsString()
  template_title?: string;

  @ApiPropertyOptional({ example: 'Thank you for your business' })
  @IsOptional()
  @IsString()
  footer_text?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  show_company_logo?: boolean;

  // Notes & terms
  @ApiPropertyOptional({ example: 'Payment due within 14 days' })
  @IsOptional()
  @IsString()
  invoice_notes?: string;

  @ApiPropertyOptional({ example: 'Goods remain property until fully paid' })
  @IsOptional()
  @IsString()
  terms_and_conditions?: string;
}
