import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { SyncInterval } from 'prisma/generated/prisma/client';

export class CreateInvoiceAutoSyncDto {
  @ApiProperty({
    example: 'Daily Invoice Sync',
    description: 'Title of the auto-sync interval',
  })
  @IsString({ message: 'Title must be a string' })
  @IsNotEmpty({ message: 'Title is required' })
  title: string;

  @ApiProperty({
    example: 'Sync invoices every day',
    description: 'Description of the auto-sync interval',
  })
  @IsString({ message: 'Description must be a string' })
  @IsNotEmpty({ message: 'Description is required' })
  description: string;

  @ApiProperty({
    enum: SyncInterval,
    example: SyncInterval.DAILY,
    description: 'Sync interval type',
  })
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  @IsEnum(SyncInterval, { message: 'Invalid sync interval' })
  @IsNotEmpty({ message: 'Sync interval is required' })
  interval: SyncInterval;
}
