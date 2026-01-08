import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class SendRegistrationOtpDto {
  @ApiProperty({
    required: true,
    type: String,
    description: 'Email address to send OTP',
    example: 'user@example.com',
  })
  @IsNotEmpty({ message: 'Email should not be empty' })
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;
}
