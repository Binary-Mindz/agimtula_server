import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/config/database/prisma.service';
import { InvoiceAutoSyncDto } from './dto/invoiceAutoSyncDto';

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
}
