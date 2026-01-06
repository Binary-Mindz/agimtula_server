import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, Matches } from 'class-validator';

export class LoginDto {
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
  password: string;
}
