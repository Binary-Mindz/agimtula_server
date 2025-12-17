import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNumber,
  IsString,
  MaxLength,
  Min,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePaymentMethodDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @MaxLength(50)
  accountName: string;

  @ApiProperty({ example: 'Bank of America' })
  @IsString()
  @MaxLength(50)
  bankName: string;

  @ApiProperty({ example: '12-34-56' })
  @IsString()
  @MaxLength(20)
  sortCode: string;

  @ApiProperty({ example: 'DE89370400440532013000' })
  @IsString()
  @MaxLength(34)
  iban: string;

  @ApiProperty({ example: 'BOFAUS3NXXX' })
  @IsString()
  @MaxLength(20)
  bicSwift: string;

  @ApiProperty({ example: 30 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  defaultPaymentTerm: number;

  @ApiProperty({ example: 50 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  latePaymentFee: number;

  @ApiProperty({ example: 'Please pay within 30 days' })
  @IsString()
  paymentInstructions: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean; // optional for creation
}
