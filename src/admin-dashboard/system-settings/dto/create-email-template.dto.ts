import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

enum TemplateType {
  WELCOME = 'WELCOME_EMAIL',
  PASSWORD_RESET = 'PASSWORD_RESET_EMAIL',
  INVOICE = 'INVOICE_EMAIL',
  WEEKLY_REPORT = 'WEEKLY_REPORT_EMAIL',
}
export class CreateEmailTemplateDto {
  @ApiProperty({
    enum: TemplateType,
    description: 'The type of the email template',
    example: TemplateType.WELCOME,
  })
  @IsEnum(TemplateType)
  @IsNotEmpty()
  key: TemplateType;

  @ApiProperty({
    description: 'The name of the email template',
    example: 'Welcome Email Template',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'The description of the email template',
    example: 'This template is used for welcoming new users.',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'The subject of the email template',
    example: 'Welcome {{username}} to Our Service!',
  })
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiProperty({
    description: 'The body HTML of the email template',
    example:
      '<h1>Welcome {{username}} to Our Service!</h1><p>We are glad to have you.</p>',
  })
  @IsString()
  @IsNotEmpty()
  bodyHtml: string;

  @ApiProperty({
    description: 'The variables used in the email template',
    example: ['username', 'resetLink'],
  })
  @IsString()
  @IsNotEmpty()
  variables: string[];
}
