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

      const updateData: any = { ...dto };
      if (existing) {
        if (dto.vat_breakdown !== undefined)
          updateData.vat_breakdown = !existing.vat_breakdown;
        if (dto.prices_include_vat !== undefined)
          updateData.prices_include_vat = !existing.prices_include_vat;
        if (dto.show_company_logo !== undefined)
          updateData.show_company_logo = !existing.show_company_logo;

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
        const invoiceLayout = await this.prisma.invoiceLayout.create({
          data: { ...dto, userId },
        });

        return cResponseData({
          success: true,
          message: 'Invoice layout created successfully',
          data: invoiceLayout,
        });
      }
    } catch (error) {
      console.error('Update invoice layout error:', error);
      throw new HttpException(
        'Failed to update invoice layout',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
