import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class ImapEmailConnectionDto {
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
    description: 'I-map user name of the user',
    example: 'user@example.com',
  })
  @IsNotEmpty({ message: 'I-map user name should not be empty' })
  @IsString({ message: 'Invalid I-map user name format' })
  imap_username: string;

  @ApiProperty({
    required: true,
    type: String,
    description: 'I-map server name of the user',
    example: 'user@example.com',
  })
  @IsNotEmpty({ message: 'I-map server name should not be empty' })
  @IsString({ message: 'Invalid I-map server name format' })
  imap_server: string;

  @ApiProperty({
    required: true,
    type: String,
    description: 'I-map port of the user',
    example: 83478,
  })
  @IsNotEmpty({ message: 'I-map port should not be empty' })
  @IsNumber({}, { message: 'Invalid I-map port format' })
  imap_port: number;

  @ApiProperty({
    required: true,
    type: String,
    description: 'I-map app password of the user',
    example: 'asdf ghjk lzxc vbnm',
  })
  @IsNotEmpty({ message: 'I-map app password should not be empty' })
  @IsString({ message: 'Invalid I-map app password format' })
  imap_app_password: string;
}
