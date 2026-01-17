import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateSupportTicketDto {
  @ApiProperty({
    description: 'Title/subject of the ticket',
    example: 'Payment method update',
  })
  @IsNotEmpty({ message: 'Subject is required' })
  @IsString({ message: 'Subject must be a string' })
  @MaxLength(150, { message: 'Subject should not exceed 150 characters' })
  subject: string;

  @ApiPropertyOptional({
    description: 'Detailed description of the issue',
    example: 'Customer cannot update the saved payment card.',
  })
  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  description?: string;
}
