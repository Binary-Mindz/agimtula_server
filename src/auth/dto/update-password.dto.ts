import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdatePasswordDto {
  @ApiProperty({
    required: true,
    type: String,
    description: 'Old password of the user',
    example: 'kldjflkLA999*&',
  })
  @IsString()
  @IsNotEmpty()
  oldPassword: string;

  @ApiProperty({
    required: true,
    type: String,
    description: 'Old password of the user',
    example: 'kldjflkLA999*&',
  })
  @IsString()
  @IsNotEmpty()
  newPassword: string;
}
