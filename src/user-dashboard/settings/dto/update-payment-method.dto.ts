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

export class UpdatePaymentMethodDto {
  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  accountName?: string;

  @ApiPropertyOptional({ example: 'Bank of America' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  bankName?: string;

  @ApiPropertyOptional({ example: '12-34-56' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  sortCode?: string;

  @ApiPropertyOptional({ example: 'DE89370400440532013000' })
  @IsOptional()
  @IsString()
  @MaxLength(34)
  iban?: string;

  @ApiPropertyOptional({ example: 'BOFAUS3NXXX' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  bicSwift?: string;

  @ApiPropertyOptional({ example: 30 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  defaultPaymentTerm?: number;

  @ApiPropertyOptional({ example: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  latePaymentFee?: number;

  @ApiPropertyOptional({ example: 'Please pay within 30 days' })
  @IsOptional()
  @IsString()
  paymentInstructions?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
