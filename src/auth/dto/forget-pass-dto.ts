import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
} from 'class-validator';

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
    description: 'Verification code sent to the user',
    example: 123456,
  })
  @IsNotEmpty({ message: 'Verification code should not be empty' })
  @Type(() => Number)
  @IsNumber({}, { message: 'Verification code must be a number' })
  verificationCode: number;
}

export class ResetPass {
  @ApiProperty({
    required: true,
    type: String,
    description: 'Password of the user',
    example: 'Password123!',
  })
  @IsNotEmpty({ message: 'Password should not be empty' })
  password: string;
}
