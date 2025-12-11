import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsNumberString, Matches } from 'class-validator';

export class ForgetPassDto {
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

export class ValidateForgetPass {
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
    type: String,
    description: 'Verification code sent to the user',
    example: '123456',
  })
  @IsNotEmpty({ message: 'Verification code should not be empty' })
  @IsNumberString({}, { message: 'Verification code must be a number' })
  verificationCode: string;
}

export class ResetPass {
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
    type: String,
    description: 'Password of the user',
    example: 'Password123!',
  })
  @IsNotEmpty({ message: 'Password should not be empty' })
  @Matches(
    /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+={}[\]|:;"'<>,.?/~`]).{6,}$/,
    {
      message:
        'Password must be 6-15 characters long, include at least 1 uppercase letter, 1 number, and 1 special character',
    },
  )
  password: string;
}
