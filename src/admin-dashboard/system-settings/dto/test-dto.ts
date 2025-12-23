import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class TestDto {
  @ApiProperty({
    description: 'Email address to send test email to',
    example: 'test@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  to: string;

  @ApiProperty({
    description: 'Data for template variables',
    example: { username: 'John Doe' },
  })
  @IsNotEmpty()
  data: Record<string, string>;
}
