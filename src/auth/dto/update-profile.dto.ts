import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description:
      'Company logo (PNG, JPG, JPEG, max 2MB, recommended 400x400px)',
  })
  profilePic?: Express.Multer.File;
}
