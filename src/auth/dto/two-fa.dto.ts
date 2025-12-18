import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsInt, IsNotEmpty, Max, Min } from 'class-validator';

export class EnableTwoFADto {
  @ApiProperty({
    required: true,
    type: String,
    description: 'Email address of the user',
    example: 'user@example.com',
  })
  @IsNotEmpty({ message: 'Email should not be empty' })
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;
}

export class VerifyTwoFADto {
  @ApiProperty({
    required: true,
    type: String,
    description: 'Email address of the user',
    example: 'user@example.com',
  })
  @IsNotEmpty({ message: 'Email should not be empty' })
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;

  @ApiProperty({
    required: true,
    description: 'Verification code sent to the user',
    example: 123456,
  })
  @IsNotEmpty({ message: 'Verification code should not be empty' })
  @IsInt({ message: 'Verification code must be a number' })
  @Min(100000, { message: 'Code must be 6 digits' })
  @Max(999999, { message: 'Code must be 6 digits' })
  code: number;
}
