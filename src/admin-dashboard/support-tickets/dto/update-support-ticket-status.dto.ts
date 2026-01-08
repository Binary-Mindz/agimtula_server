import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { SupportTicketPriority, SupportTicketStatus } from 'prisma/generated/prisma/enums';

export class UpdateSupportTicketStatusDto {
  @ApiProperty({ description: 'New status for the ticket', enum: SupportTicketStatus, example: SupportTicketStatus.IN_PROGRESS })
  @IsEnum(SupportTicketStatus)
  status: SupportTicketStatus;

  @ApiPropertyOptional({ description: 'Update priority if needed', enum: SupportTicketPriority, example: SupportTicketPriority.HIGH })
  @IsOptional()
  @IsEnum(SupportTicketPriority)
  priority?: SupportTicketPriority;
}
