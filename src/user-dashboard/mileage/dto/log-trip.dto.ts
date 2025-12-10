import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class LogTripDto {
  @ApiProperty({
    description: 'Date of the trip',
    example: '2025-12-10',
  })
  @Type(() => Date)
  @IsDate({ message: 'Date must be a valid date' })
  @IsNotEmpty({ message: 'Date is required' })
  date: Date;

  @ApiProperty({
    description: 'Starting location (e.g., Office Amsterdam)',
    example: 'Office Amsterdam',
  })
  @IsString({ message: 'Start location must be a string' })
  @IsNotEmpty({ message: 'Start location is required' })
  startLocation: string;

  @ApiProperty({
    description: 'Ending location (e.g., Client Office Rotterdam)',
    example: 'Client Office Rotterdam',
  })
  @IsString({ message: 'End location must be a string' })
  @IsNotEmpty({ message: 'End location is required' })
  endLocation: string;

  @ApiProperty({
    description: 'Distance in kilometers (auto-calculated or manual)',
    example: 58.4,
    minimum: 0,
  })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'Distance must be a valid number' },
  )
  @Min(0, { message: 'Distance cannot be negative' })
  @IsNotEmpty({ message: 'Distance is required' })
  distanceKm: number;

  @ApiProperty({
    description: 'Type of trip',
    example: 'business',
  })
  @IsNotEmpty({ message: 'Trip type is required' })
  tripType: string;

  @ApiProperty({
    description: 'Vehicle used for the trip',
    example: 'car',
  })
  @IsNotEmpty({ message: 'Vehicle is required' })
  vehicle: string;

  @ApiProperty({
    description: 'Purpose of the trip',
    example: 'Client meeting, project delivery',
  })
  @IsString({ message: 'Purpose must be a string' })
  @IsNotEmpty({ message: 'Purpose is required' })
  purpose: string;

  @ApiPropertyOptional({
    description: 'Additional notes about the trip (optional)',
    example: 'Toll road used, parking paid separately',
    nullable: true,
  })
  @IsOptional()
  @IsString({ message: 'Notes must be a string' })
  @IsNotEmpty({ message: 'Notes cannot be empty if provided' })
  notes?: string | null;
}
