import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsNotEmpty, IsString } from "class-validator";

export class UploadImageDto {
  @ApiProperty({
    description: 'Array of base64 encoded image strings',
    type: 'array',
    items: { type: 'string' },
    example: ['data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...'],
    required: true,
  })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ message: 'Images are required' })
  images: string[];
}