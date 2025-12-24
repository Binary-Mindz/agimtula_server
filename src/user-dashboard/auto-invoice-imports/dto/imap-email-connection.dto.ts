import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class ImapEmailConnectionDto {
  // @ApiProperty({
  //   required: true,
  //   type: String,
  //   description: 'Email address of the user',
  //   example: 'user@example.com',
  // })
  // @IsNotEmpty({ message: 'Email should not be empty' })
  // @IsEmail({}, { message: 'Invalid email format' })
  // email: string;

  @ApiProperty({
    required: true,
    type: String,
    description: 'I-map user name of the user',
    example: 'user@example.com',
  })
  @IsNotEmpty({ message: 'I-map user name should not be empty' })
  @IsString({ message: 'Invalid I-map user name format' })
  @IsEmail({}, { message: 'Invalid SMTP imap username format' })
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
    type: Number,
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

  @ApiProperty({
    required: false,
    type: String,
    description: 'I-map app password of the user',
    example: 'a9bfc137-6de6-4c80-ad6b-bd0b091d4f5f',
  })
  @IsOptional()
  @IsString({ message: 'Invalid real time Imap-Checking Id format' })
  realtimeImapCheckingId?: string;

  @ApiProperty({
    required: false,
    type: Boolean,
    description: ' I-map app service connect',
    example: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'Invalid connect format' })
  connect?: boolean;

  @ApiProperty({
    required: false,
    type: Boolean,
    description: ' I-map app Automatic Sync system',
    example: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'Invalid Automatic Sync format' })
  automatic_Sync?: boolean;

  @ApiProperty({
    required: false,
    type: Boolean,
    description:
      ' I-map app Automatic Sync get new invice then notification the email',
    example: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'Invalid Email Notifications format' })
  emailNotifications?: boolean;
}
