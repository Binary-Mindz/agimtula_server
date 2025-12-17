import { IsBoolean, IsEmail, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateNotificationSettingsDto {
  @ApiPropertyOptional({
    example: true,
    description: 'Notify when an invoice is sent',
  })
  @IsOptional()
  @IsBoolean()
  invoiceSent?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Notify when an invoice is paid',
  })
  @IsOptional()
  @IsBoolean()
  invoicePaid?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Notify when a payment is overdue',
  })
  @IsOptional()
  @IsBoolean()
  paymentOverdue?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Notify when a quote is viewed',
  })
  @IsOptional()
  @IsBoolean()
  quoteViewed?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Notify when a quote is accepted',
  })
  @IsOptional()
  @IsBoolean()
  quoteAccepted?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Notify for new bank transactions',
  })
  @IsOptional()
  @IsBoolean()
  newBankTransactions?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Notify for unmatched bank transactions',
  })
  @IsOptional()
  @IsBoolean()
  unmatchedTransactions?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Notify for missing receipts',
  })
  @IsOptional()
  @IsBoolean()
  missingReceipts?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Receive weekly summary emails',
  })
  @IsOptional()
  @IsBoolean()
  weeklySummary?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Receive monthly report emails',
  })
  @IsOptional()
  @IsBoolean()
  monthlyReport?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Remind about VAT filing',
  })
  @IsOptional()
  @IsBoolean()
  vatFilingReminder?: boolean;

  @ApiPropertyOptional({
    example: 'user@example.com',
    description: 'Notification email address',
  })
  @IsOptional()
  @IsEmail()
  notificationEmail?: string;

  @ApiPropertyOptional({
    example: 'weekly',
    description: 'Notification frequency: daily, weekly, monthly',
  })
  @IsOptional()
  @IsString()
  notificationFrequency?: string;
}
