import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export enum InvoiceClientType {
  CLIENT = 'CLIENT',
  BUSINESS = 'BUSINESS',
}

export class ServiceAndItemDto {
  @ApiProperty({
    description: 'The description',
    example: 'Service description',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'The quantity',
    example: 1,
  })
  @IsInt()
  @IsNotEmpty()
  qty: number;

  @ApiProperty({
    description: 'The rate',
    example: 100,
  })
  @IsNumber()
  @IsNotEmpty()
  rate: number;

  @ApiProperty({
    description: 'The total amount',
    example: 100,
  })
  @IsNumber()
  @IsNotEmpty()
  totalAmount: number;
}

export class CreateInvoiceDto {
  @ApiProperty({
    description: 'The client name',
    example: 'John Doe',
  })
  @IsString()
  @IsNotEmpty()
  invoiceNo: string;

  @ApiProperty({
    description: 'The issue date',
    example: '2021-01-01',
  })
  @IsDateString()
  @IsNotEmpty()
  issueDate: string;

  @ApiProperty({
    description: 'The due date',
    example: '2021-01-01',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @ApiProperty({
    description: 'The type of the invoice',
    example: 'CLIENT',
  })
  @IsEnum(InvoiceClientType)
  @IsNotEmpty()
  type: InvoiceClientType;

  @ApiProperty({
    description: 'The company name',
    example: 'John Doe',
  })
  @IsString()
  @IsNotEmpty()
  companyName: string;

  @ApiProperty({
    description: 'The company address',
    example: '123 Main St, Anytown, USA',
    required: false,
  })
  @IsString()
  @IsOptional()
  companyAddress?: string;

  @ApiProperty({
    description: 'The address and contact info',
    example: '123 Main St, Anytown, USA',
    required: false,
  })
  @IsString()
  @IsOptional()
  addressAndContactInfo?: string;

  @ApiProperty({
    description: 'The project information',
    example: 'Project information',
    required: false,
  })
  @IsString()
  @IsOptional()
  projectInformation?: string;

  @ApiProperty({
    description: 'The project description',
    example: 'Project description',
    required: false,
  })
  @IsString()
  @IsOptional()
  projectDescription?: string;

  @ApiProperty({
    description: 'The service and items',
    type: [ServiceAndItemDto],
    example: [
      {
        description: 'Web Development Service',
        qty: 1,
        rate: 100,
        totalAmount: 100,
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ServiceAndItemDto)
  @IsNotEmpty()
  serviceAndItems: ServiceAndItemDto[];

  @ApiProperty({
    description: 'The tax',
    example: 10,
  })
  @IsNumber()
  @IsNotEmpty()
  tax: number;

  @ApiProperty({
    description: 'The sub total',
    example: 100,
  })
  @IsNumber()
  @IsNotEmpty()
  subTotal: number;

  @ApiProperty({
    description: 'The total amount',
    example: 100,
  })
  @IsNumber()
  @IsNotEmpty()
  totalAmount: number;

  @ApiProperty({
    description: 'The mobile payment link',
    example: 'https://example.com/payment',
    required: false,
  })
  @IsString()
  @IsOptional()
  mobilePaymentLink?: string;

  @ApiProperty({
    description: 'The additional note',
    example: 'Additional note',
    required: false,
  })
  @IsString()
  @IsOptional()
  additionalNote?: string;
}
