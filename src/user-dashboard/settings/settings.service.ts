/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable, NotFoundException } from '@nestjs/common';
import { BusinessInfoDto } from './dto/business-info.dto';
import { InvoiceLayoutDto } from './dto/invoice-layout.dto';
import { PrismaService } from 'src/config/database/prisma.service';
import { deleteFromCloudinary } from 'src/config/cloudinary/deleteImage';
import uploadToCloudinary from 'src/config/cloudinary/cloudinary';
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

  async updateBusinessLogo(userId: string, file: Express.Multer.File) {
    try {
      if (!file) throw new NotFoundException('File not found');

      console.log(file.originalname);

      const businessInfo = await this.prisma.businessInfo.findUnique({
        where: { userId },
      });

      if (!businessInfo) throw new NotFoundException('Business info not found');

      if (businessInfo.logoKey) {
        await deleteFromCloudinary(businessInfo.logoKey);
      }

      console.log(businessInfo);

      const uploadResult = await uploadToCloudinary(file);

      console.log(uploadResult.secure_Url);

      await this.prisma.businessInfo.update({
        where: { userId },
        data: {
          logo: uploadResult.secure_url,
          logoKey: uploadResult.public_id,
        },
      });

      return cResponseData({
        message: 'Business logo updated successfully',
        data: uploadResult.secure_url,
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

      if (businessInfo.logoKey) {
        await deleteFromCloudinary(businessInfo.logoKey);
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
