import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from 'src/config/database/prisma.service';
import { InvoiceAutoSyncDto } from './dto/invoiceAutoSyncDto';
import { UpdateAutoSyncDto } from './dto/update-auto-sync.dto';
import { cResponseData } from 'src/common/cResponse';

@Injectable()
export class InvoiceAutoSyncIntervalService {
  constructor(private prisma: PrismaService) {}

  async createInvoiceAutoSyncInterval(data: InvoiceAutoSyncDto) {
    try {
      const invoiceAutoSyncInterval =
        await this.prisma.invoiceAutoSyncInterval.create({
          data,
        });

      return cResponseData({
        message: 'Invoice auto sync interval created successfully',
        data: invoiceAutoSyncInterval,
      });
    } catch (error) {
      console.error('Create invoice auto sync interval error:', error);
      throw new HttpException(
        'Failed to create invoice auto sync interval',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getAllInvoiceAutoSyncIntervals() {
    try {
      const intervals = await this.prisma.invoiceAutoSyncInterval.findMany();
      return cResponseData({
        data: intervals,
        message: 'Invoice auto sync intervals retrieved successfully',
      });
    } catch (error) {
      console.error('Get all invoice auto sync intervals error:', error);
      throw new HttpException(
        'Failed to retrieve invoice auto sync intervals',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async updateInvoiceAutoSyncIntervals(id: string, dto: UpdateAutoSyncDto) {
    try {
      const invoiceAutoSyncInterval =
        await this.prisma.invoiceAutoSyncInterval.update({
          where: { id },
          data: dto,
        });

      return cResponseData({
        message: 'Invoice auto sync interval updated successfully',
        data: invoiceAutoSyncInterval,
      });
    } catch (error) {
      console.error('Update invoice auto sync interval error:', error);
      throw new HttpException(
        'Failed to update invoice auto sync interval',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async deleteAutoSyncIntervals(id: string) {
    try {
      const invoiceAutoSyncInterval =
        await this.prisma.invoiceAutoSyncInterval.delete({
          where: { id },
        });

      return cResponseData({
        message: 'Invoice auto sync interval deleted successfully',
        data: invoiceAutoSyncInterval,
      });
    } catch (error) {
      console.error('Delete invoice auto sync interval error:', error);
      throw new HttpException(
        'Failed to delete invoice auto sync interval',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
