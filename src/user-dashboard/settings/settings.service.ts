import { Injectable, NotFoundException } from '@nestjs/common';
import { BusinessInfoDto } from './dto/business-info.dto';
import { InvoiceLayoutDto } from './dto/invoice-layout.dto';
import { PrismaService } from 'src/config/database/prisma.service';
import { deleteFromCloudinary } from 'src/config/cloudinary/deleteImage';
import uploadToCloudinary from 'src/config/cloudinary/cloudinary';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async updateBusinessInfo(userId: string, dto: BusinessInfoDto) {
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

    return businessInfo;
  }

  async updateBusinessLogo(userId: string, file: Express.Multer.File) {
    if (!file) throw new NotFoundException('File not found');

    console.log(file.originalname);

    const businessInfo = await this.prisma.businessInfo.findUnique({
      where: { userId },
    });

    console.log(businessInfo);

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

    return {
      message: 'Business logo updated successfully',
      logo: uploadResult.secure_url,
    };
  }

  async removeBusinessLogo(userId: string) {
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

    return {
      message: 'Business logo removed successfully',
    };
  }

  async getBusinessInfo(userId: string) {
    const businessInfo = await this.prisma.businessInfo.findUnique({
      where: { userId },
    });
    return businessInfo;
  }

  invoiceLayout(dto: InvoiceLayoutDto) {
    return { dto };
  }
}
