import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsNumber } from 'class-validator';

export class VerifyRegistrationOtpDto {
  @ApiProperty({
    required: true,
    type: String,
    description: 'Email address',
    example: 'user@example.com',
  })
  @IsNotEmpty({ message: 'Email should not be empty' })
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;

  @ApiProperty({
    required: true,
    type: Number,
    description: '6-digit OTP code',
    example: 123456,
  })
  @IsNotEmpty({ message: 'OTP code should not be empty' })
  @IsNumber({}, { message: 'OTP code must be a number' })
  code: number;
}
