import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';

export class PaymentMethodDto {
  @ApiProperty({
    description: 'Account holder name (as registered with the bank)',
    example: 'John Doe Trading Ltd',
  })
  @IsNotEmpty({ message: 'Account name is required' })
  @IsString()
  accountName: string;

  @ApiProperty({
    description: 'Full name of the bank',
    example: 'Bank of Ireland',
  })
  @IsNotEmpty({ message: 'Bank name is required' })
  @IsString()
  bankName: string;

  @ApiProperty({
    description: 'Irish Sort Code (NSC) - format XX-XX-XX',
    example: '93-11-52',
  })
  @IsNotEmpty({ message: 'Sort code is required' })
  @IsString()
  @Matches(/^(\d{2}-){2}\d{2}$/, {
    message: 'Sort code must be in format XX-XX-XX (e.g., 93-11-52)',
  })
  sortCode: string;

  @ApiProperty({
    description: 'International Bank Account Number',
    example: 'IE29AIBK93115212345678',
  })
  @IsNotEmpty({ message: 'IBAN is required' })
  @IsString()
  @Matches(/^IE\d{2}[A-Z]{4}\d{14}$/, {
    message:
      'Invalid Irish IBAN format. Must start with IE followed by 20 characters',
  })
  iban: string;

  @ApiProperty({
    description: 'BIC/SWIFT code (8 or 11 characters)',
    example: 'AIBKIE2D',
  })
  @IsNotEmpty({ message: 'BIC/SWIFT is required' })
  @IsString()
  @Matches(/^[A-Z]{4}IE[A-Z0-9]{2}([A-Z0-9]{3})?$/, {
    message: 'Invalid BIC/SWIFT code for Ireland',
  })
  bicSwift: string;

  // ── Payment Terms & Preferences ──

  @ApiPropertyOptional({
    description: 'Default payment terms (e.g., Due on receipt, Net 30)',
    example: 'Net 30 days',
    default: 'Net 30 days',
  })
  @IsOptional()
  @IsString()
  defaultPaymentTerm?: string;

  @ApiPropertyOptional({
    description: 'Late payment fee as percentage (%)',
    example: 5,
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  latePaymentFee?: number;

  @ApiPropertyOptional({
    description: 'Additional payment instructions shown on invoices',
    example:
      'Please quote invoice number with payment. SEPA transfers preferred.',
  })
  @IsOptional()
  @IsString()
  paymentInstructions?: string;
}
