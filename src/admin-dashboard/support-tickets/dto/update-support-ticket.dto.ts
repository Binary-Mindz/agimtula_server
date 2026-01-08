import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { SupportTicketPriority } from 'prisma/generated/prisma/enums';

export class UpdateSupportTicketDto {
  @ApiPropertyOptional({ description: 'Update subject', example: 'Multi-currency feature request' })
  @IsOptional()
  @IsString({ message: 'Subject must be a string' })
  @MaxLength(150, { message: 'Subject should not exceed 150 characters' })
  subject?: string;

  @ApiPropertyOptional({ description: 'Update description' })
  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  description?: string;

  @ApiPropertyOptional({ description: 'Update priority', enum: SupportTicketPriority })
  @IsOptional()
  @IsEnum(SupportTicketPriority)
  priority?: SupportTicketPriority;
}
