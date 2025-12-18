import { Injectable } from '@nestjs/common';
import { UploadReceiptDto } from './dto/upload-receipt.dto';
import uploadToCloudinary from 'src/config/cloudinary/cloudinary';
import { PrismaService } from 'src/config/database/prisma.service';
import { cResponseData } from 'src/common/cResponse';

@Injectable()
export class ReceiptsService {
  constructor(private prisma: PrismaService) {}

  // Receipt Category

  async createReceiptCategory(name: string) {
    return await this.prisma.receiptCategory.create({
      data: { name },
    });
  }

  async getAllReceiptCategories() {
    return await this.prisma.receiptCategory.findMany();
  }

  async uploadReceipt(
    userId: string,
    dto: UploadReceiptDto,
    file: Express.Multer.File,
  ) {
    const { vendor, amount, date, category } = dto;

    let fileName: string | undefined;
    let fileKey: string | undefined;

    if (file) {
      const fileData = await uploadToCloudinary(file);
      fileName = fileData.secure_url;
      fileKey = fileData.public_id;
    }

    await this.prisma.receipt.create({
      data: {
        vendor,
        amount,
        date,
        categoryId: category,
        receiptFileUrl: fileName,
        receiptFileKey: fileKey,
        userId,
      },
    });

    return cResponseData({ message: 'Receipt uploaded successfully' });
  }

  async getReceiptsData(
    userId: string,
    search: string,
    filterCategory: string,
  ) {
    const query = {
      userId: userId,
    };

    if (search) {
      query['vendor'] = { contains: search, mode: 'insensitive' };
    }

    if (filterCategory) {
      query['category'] = { name: filterCategory };
    }

    const receipts = await this.prisma.receipt.findMany({
      where: query,
      select: {
        id: true,
        vendor: true,
        date: true,
        amount: true,
        category: {
          select: {
            name: true,
          },
        },
      },
    });

    if (receipts.length === 0) {
      return cResponseData({ message: 'No receipts found' });
    }
    return cResponseData({
      message: 'Receipts retrieved successfully',
      data: receipts,
    });
  }
}
