import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
} from 'class-validator';

export class BusinessInfoDto {
  @ApiProperty({
    description: 'Your job title',
    example: 'Software developer',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  jobTitle?: string;

  @ApiProperty({
    description: 'Legal business or trading name',
    example: 'Acme Trading Ltd',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  companyName?: string;

  @ApiProperty({
    description: 'VAT number (with country prefix, e.g., IE1234567FA)',
    example: 'IE1234567FA',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{2}[0-9A-Z]{8,12}$/, {
    message:
      'Invalid VAT number format. Must include country code (e.g., IE1234567FA)',
  })
  vatNumber?: string;

  @ApiProperty({
    description: 'Address line 1 (street address)',
    example: '123 Business Street',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  address1?: string;

  @ApiPropertyOptional({
    description: 'Address line 2 (apartment, suite, etc.)',
    example: 'Unit 4B',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  address2?: string;

  @ApiPropertyOptional({
    description: 'Address line 3 (area, suburb, or postal town)',
    example: 'Dublin 2',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  address3?: string;

  @ApiProperty({
    description: 'Country name',
    example: 'Ireland',
  })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({
    description: 'Company website URL',
    example: 'https://www.acmetrading.ie',
  })
  @IsOptional()
  @IsString()
  @IsUrl({ require_tld: true }, { message: 'Please enter a valid website URL' })
  website?: string;
}

export class UpdateLogoDto {
  @ApiPropertyOptional({
    type: 'string',
    description: 'Base64 encoded company logo image (PNG, JPG, JPEG)',
    example: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
  })
  @IsOptional()
  @IsString()
  logo?: string;
}
