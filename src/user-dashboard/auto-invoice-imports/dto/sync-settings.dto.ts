import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class SyncSettingsDto {
  @ApiProperty({
    example: true,
    description: 'Enable or disable automatic synchronization of invoices',
  })
  @IsBoolean()
  @IsNotEmpty()
  automaticSync: boolean;

  @ApiProperty({
    example: '36c0a8e2-65f9-4460-8de6-52b4e22d5732',
    description: 'Frequency of synchronization (e.g., daily, weekly, monthly)',
  })
  @IsNotEmpty()
  @IsString()
  syncFrequency: string;

  @ApiProperty({
    example: true,
    description: 'Enable or disable email notifications for sync status',
  })
  @IsBoolean()
  @IsNotEmpty()
  emailNotification?: boolean;
}
