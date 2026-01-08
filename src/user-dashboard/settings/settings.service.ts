/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable, NotFoundException } from '@nestjs/common';
import { BusinessInfoDto } from './dto/business-info.dto';
import { InvoiceLayoutDto } from './dto/invoice-layout.dto';
import { PrismaService } from 'src/config/database/prisma.service';
import { cResponseData } from 'src/common/cResponse';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async updateBusinessInfo(userId: string, dto: BusinessInfoDto) {
    try {
      const businessInfo = await this.prisma.businessInfo.upsert({
        where: { userId },
        update: dto,
        create: {
          ...dto,
          user: {
            connect: { id: userId },
          },
        },
      });

      return cResponseData({ data: businessInfo });
    } catch (error) {
      return cResponseData({
        message: 'Failed to update business info',
        error: 'Failed to update business info',
      });
    }
  }

  async updateBusinessLogo(userId: string, logoBase64?: string) {
    try {
      if (!logoBase64) {
        throw new NotFoundException('Logo data not provided');
      }

      const businessInfo = await this.prisma.businessInfo.findUnique({
        where: { userId },
      });

      if (!businessInfo) {
        throw new NotFoundException('Business info not found');
      }

      await this.prisma.businessInfo.update({
        where: { userId },
        data: {
          logo: logoBase64,
          logoKey: null, // No longer using Cloudinary keys
        },
      });

      return cResponseData({
        message: 'Business logo updated successfully',
        data: logoBase64,
      });
    } catch (error) {
      return cResponseData({
        message: 'Failed to update business logo',
        error: 'Failed to update business logo',
      });
    }
  }

  async removeBusinessLogo(userId: string) {
    try {
      const businessInfo = await this.prisma.businessInfo.findUnique({
        where: { userId },
      });

      if (!businessInfo) {
        throw new NotFoundException('Business info not found');
      }

      await this.prisma.businessInfo.update({
        where: { userId },
        data: {
          logo: null,
          logoKey: null,
        },
      });

      return cResponseData({
        message: 'Business logo removed successfully',
        data: null,
      });
    } catch (error) {
      return cResponseData({
        message: 'Failed to remove business logo',
        error: 'Failed to remove business logo',
      });
    }
  }

  async getBusinessInfo(userId: string) {
    const businessInfo = await this.prisma.businessInfo.findUnique({
      where: { userId },
    });
    return cResponseData({ data: businessInfo });
  }

  invoiceLayout(dto: InvoiceLayoutDto) {
    return { dto };
  }
}
