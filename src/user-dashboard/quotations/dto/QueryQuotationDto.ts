import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsNumber, IsDateString } from 'class-validator';
import { DeliveryStatus } from './create-quotation.dto';
import { Type } from 'class-transformer';

export class QueryQuotationDto {
  @ApiPropertyOptional({ example: 'ABC' })
  @IsOptional()
  @IsString()
  clientName?: string;

  @ApiPropertyOptional({ example: '2025-01-01' })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ example: 15000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  amount?: number;

  @ApiPropertyOptional({ enum: DeliveryStatus })
  @IsOptional()
  @IsEnum(DeliveryStatus)
  status?: DeliveryStatus;
}
