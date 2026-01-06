import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UploadReceiptDto {
  @ApiProperty({
    description: 'Path or URL to the uploaded receipt file',
    example: 'uploads/receipts/receipt12345.jpg',
  })
  @IsNotEmpty({ message: 'Receipt file is required' })
  @IsOptional()
  receiptFile?: string;

  @ApiProperty({
    description: 'Vendor or merchant name (auto-filled by OCR, but editable)',
    example: 'Office Supplies Co',
  })
  @IsString()
  @IsNotEmpty({ message: 'Vendor/Merchant is required' })
  vendor: string;

  @ApiProperty({
    description: 'Total amount on the receipt (in EUR)',
    example: 145.8,
    minimum: 0,
  })
  @Type(() => Number)
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'Amount must be a valid number' },
  )
  @Min(0, { message: 'Amount cannot be negative' })
  @IsNotEmpty({ message: 'Amount is required' })
  amount: number;

  @ApiProperty({
    description: 'Date on the receipt',
    example: '2025-12-08',
  })
  @Type(() => Date)
  @IsDate({ message: 'Date must be a valid date' })
  @IsNotEmpty({ message: 'Date is required' })
  date: Date;

  @ApiProperty({
    description: 'Category of the expense',
    example: '071d7ea4-8e93-4469-81be-8744458f25ed',
  })
  @IsString({ message: 'Invalid category' })
  @IsNotEmpty({ message: 'Category is required' })
  category: string;

  @ApiPropertyOptional({
    description: 'Additional notes about this receipt',
    example: 'Printer paper and toner for Q4 reports',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Notes cannot be empty if provided' })
  notes?: string;
}
