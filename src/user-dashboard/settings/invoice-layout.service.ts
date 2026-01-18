import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InvoiceLayoutDto } from './dto/invoice-layout.dto';
import { PrismaService } from 'src/config/database/prisma.service';
import { cResponseData } from 'src/common/cResponse';

@Injectable()
export class InvoiceLayoutService {
  constructor(private readonly prisma: PrismaService) {}

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
      const existing = await this.prisma.invoiceLayout.findUnique({
        where: { userId },
      });

      const updateData: {
        [key: string]: string | number | boolean | undefined;
      } = {};


      if (existing) {
        if (dto.vat_breakdown !== undefined) {
          updateData.vat_breakdown = !existing.vat_breakdown;
        }
        if (dto.prices_include_vat !== undefined) {
          updateData.prices_include_vat = !existing.prices_include_vat;
        }
        if (dto.show_company_logo !== undefined) {
          updateData.show_company_logo = !existing.show_company_logo;
        }

        // Copy other fields from dto
        const otherFields: (keyof InvoiceLayoutDto)[] = [
          'invoice_prefix',
          'lastInvoiceNumber',
          'quote_prefix',
          'year_format',
          'default_vat_rate',
          'template_title',
          'footer_text',
          'invoice_notes',
          'terms_and_conditions',
        ];

       for (const field in dto) {
         if (dto[field as keyof InvoiceLayoutDto] !== undefined) {
           updateData[field] = dto[field as keyof InvoiceLayoutDto];
         }
       }

        for (const field of otherFields) {
          if (dto[field] !== undefined) {
            updateData[field] = dto[field];
          }
        }

        const invoiceLayout = await this.prisma.invoiceLayout.update({
          where: { userId },
          data: updateData,
        });

        return cResponseData({
          success: true,
          message: 'Invoice layout updated successfully',
          data: invoiceLayout,
        });
      } else {
        // Create new layout
        const invoiceLayout = await this.prisma.invoiceLayout.create({
          data: { ...dto, userId },
        });

        return cResponseData({
          success: true,
          message: 'Invoice layout created successfully',
          data: invoiceLayout,
        });
      }
    } catch (error: any) {
      if (error.code === 'P2002') {
        // Unique constraint failed
        throw new HttpException(
          'Invoice layout for this user already exists',
          HttpStatus.BAD_REQUEST,
        );
      }

      console.error('Update invoice layout error:', error);
      throw new HttpException(
        'Failed to update invoice layout',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}