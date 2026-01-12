import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { logpriority, LogType } from 'prisma/generated/prisma/enums';

export class QueryLoggerDto {
  @ApiPropertyOptional({
    description: 'Log type filter',
    enum: LogType,
    example: LogType.ERROR,
  })
  @IsOptional()
  @IsEnum(LogType)
  level?: LogType;

  @ApiPropertyOptional({
    description: 'Log priority filter',
    enum: logpriority,
    example: logpriority.HIGH,
  })
  @IsOptional()
  @IsEnum(logpriority)
  logpriority?: logpriority;

  @ApiPropertyOptional({
    description: 'Page number',
    minimum: 1,
    default: 1,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    minimum: 1,
    maximum: 100,
    default: 10,
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}