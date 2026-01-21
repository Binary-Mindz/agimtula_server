import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsNumber, IsPhoneNumber, IsDateString } from 'class-validator';

export class CreateQuotationDto {
  @ApiProperty({
    example: 'ABC Corporation',
    description: 'Client full name or company name',
  })
  @IsNotEmpty()
  clientName: string;

  @ApiProperty({
    example: 'client@example.com',
    description: 'Client email address',
  })
  @IsEmail()
  clientEmail: string;

  @ApiProperty({
    example: '+8801712345678',
    description: 'Client phone number',
  })
  @IsPhoneNumber()
  clientPhone: string;

  @ApiProperty({
    example: '2025-01-01',
    description: 'Quotation date (ISO format)',
  })
  @IsDateString()
  date: string;

  @ApiProperty({
    example: 15000,
    description: 'Proposed quotation amount',
  })
  @IsNumber()
  amount: number;
}