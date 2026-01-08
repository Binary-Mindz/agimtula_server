import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
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

      return cResponseData({
        success: true,
        message: 'Business info updated successfully',
        data: businessInfo,
      });
    } catch (error) {
      console.error('Update business info error:', error);
      throw new HttpException(
        'Failed to update business info',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async updateBusinessLogo(userId: string, logoBase64?: string) {
    try {
      if (!logoBase64) {
        throw new HttpException(
          'Logo data not provided',
          HttpStatus.BAD_REQUEST,
        );
      }

      const businessInfo = await this.prisma.businessInfo.findUnique({
        where: { userId },
      });

      if (!businessInfo) {
        throw new HttpException(
          'Business info not found',
          HttpStatus.NOT_FOUND,
        );
      }

      await this.prisma.businessInfo.update({
        where: { userId },
        data: {
          logo: logoBase64,
          logoKey: null,
        },
      });

      return cResponseData({
        success: true,
        message: 'Business logo updated successfully',
        data: logoBase64,
      });
    } catch (error) {
      console.error('Update business logo error:', error);
      throw new HttpException(
        'Failed to update business logo',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async removeBusinessLogo(userId: string) {
    try {
      const businessInfo = await this.prisma.businessInfo.findUnique({
        where: { userId },
      });

      if (!businessInfo) {
        throw new HttpException(
          'Business info not found',
          HttpStatus.NOT_FOUND,
        );
      }

      await this.prisma.businessInfo.update({
        where: { userId },
        data: {
          logo: null,
          logoKey: null,
        },
      });

      return cResponseData({
        success: true,
        message: 'Business logo removed successfully',
        data: null,
      });
    } catch (error) {
      console.error('Remove business logo error:', error);
      throw new HttpException(
        'Failed to remove business logo',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getBusinessInfo(userId: string) {
    try {
      const businessInfo = await this.prisma.businessInfo.findUnique({
        where: { userId },
      });

      return cResponseData({
        success: true,
        message: 'Business info retrieved successfully',
        data: businessInfo,
      });
    } catch (error) {
      console.error('Get business info error:', error);
      throw new HttpException(
        'Failed to retrieve business info',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  invoiceLayout(dto: InvoiceLayoutDto) {
    return { dto };
  }
}
