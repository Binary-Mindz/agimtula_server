import { Injectable } from '@nestjs/common';
import { BusinessInfoDto } from './dto/business-info.dto';
import { InvoiceLayoutDto } from './dto/invoice-layout.dto';
import cloudinary from 'src/config/cloudinary';
import { PrismaService } from 'src/config/database/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  private uploadToCloudinary(file: Express.Multer.File): Promise<any> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { resource_type: 'auto' },
        (error, result) => {
          if (error) {
            return reject(
              new Error(error.message || 'Cloudinary upload failed'),
            );
          }
          resolve(result);
        },
      );

      uploadStream.end(file.buffer);
    });
  }

  async updateBusinessInfo(
    userId: string,
    dto: BusinessInfoDto,
    file?: Express.Multer.File,
  ) {
    let logoUrl: string | undefined;
    let logoKey: string | undefined;

    // Upload logo if file exists
    if (file) {
      const uploadResult = await this.uploadToCloudinary(file);
      logoUrl = uploadResult.secure_url;
      logoKey = uploadResult.public_id;
    }

    const { ...businessData } = dto;

    const businessInfo = await this.prisma.businessInfo.upsert({
      where: { userId },
      update: {
        ...businessData,
        logo: logoUrl,
        logoKey,
      },
      create: {
        ...businessData,
        logo: logoUrl,
        logoKey,
        user: {
          connect: { id: userId },
        },
      },
    });

    return businessInfo;
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
