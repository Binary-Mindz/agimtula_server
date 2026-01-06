import { IsOptional, IsInt, Min, IsString, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { TransactionStatus } from 'prisma/generated/prisma/enums';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class TransactionQueryDto {
  @ApiPropertyOptional({ required: false, description: 'Page number for pagination', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;


  @ApiPropertyOptional({ required: false, description: 'Number of items per page for pagination', example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;


  @ApiPropertyOptional({ required: false, description: 'Search term to filter transactions', example: 'invoice' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ required: false, description: 'Status of the transaction', enum: TransactionStatus })
  @IsOptional()
  @IsEnum(TransactionStatus)
  status?: TransactionStatus;
}
