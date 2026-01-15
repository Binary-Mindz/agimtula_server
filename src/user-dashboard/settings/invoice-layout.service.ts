import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { InvoiceLayoutDto } from './dto/invoice-layout.dto';
import { PrismaService } from 'src/config/database/prisma.service';
import { cResponseData } from 'src/common/cResponse'; 
@Injectable()
export class InvoiceLayoutService {
  private readonly logger = new Logger(InvoiceLayoutService.name)
  constructor(private readonly prisma: PrismaService,
      
  ) {}

  async findByUser(userId: string) {
    try {
      const invoiceLayout = await this.prisma.invoiceLayout.findUnique({
        where: { userId },
      });

      return cResponseData({
        success: true,
        message: 'Invoice layout retrieved successfully',
        data: invoiceLayout,
      });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Find invoice layout error:', error);
      throw new HttpException(
        'Failed to fetch invoice layout',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

async updateLayout(userId: string, dto: InvoiceLayoutDto) {
  try {
    const layout = await this.prisma.invoiceLayout.upsert({
      where: { userId },
      update: { ...dto },
      create: {
        userId,
        ...dto,
        lastInvoiceNumber: dto.lastInvoiceNumber
          ? String(dto.lastInvoiceNumber)
          : '0',
      },
    });

    return cResponseData({
      success: true,
      message: 'Invoice layout saved successfully',
      data: layout,
    });

  } catch (error) {
    this.logger.error('Invoice layout upsert failed', error);

    throw new HttpException(
      'Failed to save invoice layout',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}}