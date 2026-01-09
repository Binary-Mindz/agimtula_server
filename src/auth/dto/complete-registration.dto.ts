import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class CompleteRegistrationDto {
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
    type: String,
    description: 'First name of the user',
    example: 'John',
  })
  @IsNotEmpty({ message: 'First name should not be empty' })
  @IsString({ message: 'First name must be a string' })
  firstName: string;

  @ApiProperty({
    required: true,
    type: String,
    description: 'Last name of the user',
    example: 'Doe',
  })
  @IsNotEmpty({ message: 'Last name should not be empty' })
  @IsString({ message: 'Last name must be a string' })
  lastName: string;

  @ApiProperty({
    required: true,
    type: String,
    description: 'Password of the user',
    example: 'Password123!',
  })
  @IsNotEmpty({ message: 'Password should not be empty' })
  @IsString({ message: 'Password must be a string' })
  password: string;

  @ApiProperty({
    required: true,
    type: String,
    description: 'Verification token from OTP verification',
    example: 'a5d7fa9c87f385f0934fbed3b8cc7c81681360c7dbfe1925bdaa8d0a1d32bf14',
  })
  @IsNotEmpty({ message: 'Verification token should not be empty' })
  @IsString({ message: 'Verification token must be a string' })
  verificationToken: string;
}
