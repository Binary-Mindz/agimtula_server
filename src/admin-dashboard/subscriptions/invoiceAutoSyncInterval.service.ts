import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from 'src/config/database/prisma.service';
import { CreateInvoiceAutoSyncDto } from './dto/create-invoice-auto-sync.dto';
import { UpdateAutoSyncDto } from './dto/update-auto-sync.dto';
import { cResponseData } from 'src/common/cResponse';
import { SyncInterval } from 'prisma/generated/prisma/client';

@Injectable()
export class InvoiceAutoSyncIntervalService {
  constructor(private prisma: PrismaService) {}

  private getCronExpression(interval: SyncInterval): string {
    const cronMap = {
      [SyncInterval.DAILY]: '0 0 * * *',
      [SyncInterval.HOURLY]: '0 * * * *',
      [SyncInterval.EVERY_15_MINUTES]: '*/15 * * * *',
    };
    return cronMap[interval];
  }

  getAvailableIntervals() {
    return cResponseData({
      data: [
        { value: SyncInterval.DAILY, label: 'Daily', cron: '0 0 * * *' },
        { value: SyncInterval.HOURLY, label: 'Every Hour', cron: '0 * * * *' },
        {
          value: SyncInterval.EVERY_15_MINUTES,
          label: 'Every 15 Minutes',
          cron: '*/15 * * * *',
        },
      ],
      message: 'Available sync intervals retrieved successfully',
    });
  }

  async createInvoiceAutoSyncInterval(data: CreateInvoiceAutoSyncDto) {
    try {
      const cronTime = this.getCronExpression(data.interval);
      const invoiceAutoSyncInterval =
        await this.prisma.invoiceAutoSyncInterval.create({
          data: {
            title: data.title,
            description: data.description,
            interval: data.interval,
            cronTime,
          },
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
      if (!id) {
        throw new HttpException('ID is required', HttpStatus.BAD_REQUEST);
      }

      const isInvoiceAutoSyncInterval =
        await this.prisma.invoiceAutoSyncInterval.findUnique({
          where: { id },
        });

      if (!isInvoiceAutoSyncInterval) {
        throw new HttpException(
          'Invoice auto sync interval not found',
          HttpStatus.NOT_FOUND,
        );
      }

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
      if (!id) {
        throw new HttpException('ID is required', HttpStatus.BAD_REQUEST);
      }

      const isInvoiceAutoSyncInterval =
        await this.prisma.invoiceAutoSyncInterval.findUnique({
          where: { id },
        });

      if (!isInvoiceAutoSyncInterval) {
        throw new HttpException(
          'Invoice auto sync interval not found',
          HttpStatus.NOT_FOUND,
        );
      }

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
