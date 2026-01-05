/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable } from '@nestjs/common';
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

      return cResponseData({ data: invoiceLayout });
    } catch (error) {
      return cResponseData({
        message: 'Failed to fetch invoice layout',
        error: 'Failed to fetch invoice layout',
      });
    }
  }

  async updateLayout(userId: string, dto: InvoiceLayoutDto) {
    try {
      const existing = await this.prisma.invoiceLayout.findUnique({
        where: { userId },
      });

      const updateData: any = { ...dto };
      if (existing) {
        if (dto.tax_breakdown !== undefined)
          updateData.tax_breakdown = !existing.tax_breakdown;
        if (dto.prices_include_tax !== undefined)
          updateData.prices_include_tax = !existing.prices_include_tax;
        if (dto.show_company_logo !== undefined)
          updateData.show_company_logo = !existing.show_company_logo;

        const invoiceLayout = await this.prisma.invoiceLayout.update({
          where: { userId },
          data: updateData,
        });

        return cResponseData({ data: invoiceLayout });
      } else {
        const invoiceLayout = await this.prisma.invoiceLayout.create({
          data: { ...dto, userId },
        });
        return cResponseData({ data: invoiceLayout });
      }
    } catch (error) {
      return cResponseData({
        message: 'Failed to update invoice layout',
        error: 'Failed to update invoice layout',
      });
    }
  }
}
