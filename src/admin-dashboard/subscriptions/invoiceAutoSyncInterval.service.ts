import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/config/database/prisma.service';
import { InvoiceAutoSyncDto } from './dto/invoiceAutoSyncDto';
import { UpdateAutoSyncDto } from './dto/update-auto-sync.dto';
import { cResponseData } from 'src/common/cResponse';

@Injectable()
export class InvoiceAutoSyncIntervalService {
  constructor(private prisma: PrismaService) {}

  async createInvoiceAutoSyncInterval(data: InvoiceAutoSyncDto) {
    const invoiceAutoSyncInterval =
      await this.prisma.invoiceAutoSyncInterval.create({
        data,
      });

    return {
      message: 'Invoice auto sync interval created successfully',
      invoiceAutoSyncInterval,
    };
  }

  async getAllInvoiceAutoSyncIntervals() {
    return await this.prisma.invoiceAutoSyncInterval.findMany();
  }

  async updateInvoiceAutoSyncIntervals(id: string, dto: UpdateAutoSyncDto) {
    const invoiceAutoSyncInterval =
      await this.prisma.invoiceAutoSyncInterval.update({
        where: { id },
        data: dto,
      });

    return {
      message: 'Invoice auto sync interval updated successfully',
      invoiceAutoSyncInterval,
    };
  }

  async deleteAutoSyncIntervals(id: string) {
    try {
      const invoiceAutoSyncInterval =
        await this.prisma.invoiceAutoSyncInterval.delete({
          where: { id },
        });

      return cResponseData({
        message: 'Invoice auto sync interval deleted successfully',
        invoiceAutoSyncInterval,
      });
    } catch (error) {
      return cResponseData({ message: error.message as string, error: error });
    }
  }
}
