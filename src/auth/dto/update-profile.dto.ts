import { ApiProperty, } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateProfileDto {
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
    type: String,
    description: 'phone number of the user',
    example: '+8801300000000',
  })
  @IsString({ message: 'Last name must be a string' })
  @IsOptional()
  phone: string;

  @ApiProperty({
    type: String,
    description: 'Job title of the user',
    example: 'Backend Developer',
  })
  @IsString({ message: 'Job title must be a string' })
  @IsOptional()
  jobTitle: string;
}

export class UpdateProfilePicDto {
  @ApiProperty({
    required: true,
    type: String,
    description: 'URL of the new profile picture',
    example: 'https://example.com/profile-pic.jpg',
  })
  @IsNotEmpty({ message: 'Profile picture URL should not be empty' })
  @IsString({ message: 'Profile picture URL must be a string' })
  profilePic: string;
}
