import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class InvoiceAutoSyncDto {
  @ApiProperty({
    example: 'Monthly Sync',
    description: 'Title of the auto-sync interval',
  })
  @IsString({ message: 'Title must be a string' })
  @IsNotEmpty({ message: 'Title is required' })
  title: string;

  @ApiProperty({
    example: 'Sync invoices every month',
    description: 'Description of the auto-sync interval',
  })
  @IsString({ message: 'Description must be a string' })
  @IsNotEmpty({ message: 'Description is required' })
  description: string;

  @ApiProperty({
    example: '0 0 1 * *',
    description: 'Cron expression for the auto-sync interval',
  })
  @IsString({ message: 'Cron time must be a string' })
  @IsNotEmpty({ message: 'Cron time is required' })
  cronTime: string;
}
