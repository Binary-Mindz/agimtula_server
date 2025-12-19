import { Injectable } from '@nestjs/common';
import { UploadReceiptDto } from './dto/upload-receipt.dto';
import uploadToCloudinary from 'src/config/cloudinary/cloudinary';
import { PrismaService } from 'src/config/database/prisma.service';
import { cResponseData } from 'src/common/cResponse';
import { UpdateReceiptDto } from './dto/update-receipt-dto';

@Injectable()
export class ReceiptsService {
  constructor(private prisma: PrismaService) {}

  // Receipt Category

  async createReceiptCategory(name: string) {
    try {
      await this.prisma.receiptCategory.create({
        data: { name },
      });

      return cResponseData({
        message: 'Receipt category created successfully',
      });
    } catch (error) {
      return cResponseData({ message: error.message as string, error: error });
    }
  }

  async getAllReceiptCategories() {
    try {
      const categories = await this.prisma.receiptCategory.findMany();

      return cResponseData({
        message: 'Receipt categories retrieved successfully',
        data: categories,
      });
    } catch (error) {
      return cResponseData({ message: error.message as string, error: error });
    }
  }

  async deleteCategory(id: string) {
    try {
      const category = await this.prisma.receiptCategory.findUnique({
        where: { id },
      });
      return cResponseData({
        message: 'Category deleted successfully',
        data: category,
      });
    } catch (error) {
      return cResponseData({ message: error.message as string, error: error });
    }
  }

  async uploadReceipt(
    userId: string,
    dto: UploadReceiptDto,
    file: Express.Multer.File,
  ) {
    try {
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
    } catch (error) {
      return cResponseData({ message: error.message as string, error: error });
    }
  }

  async getReceiptsData(
    userId: string,
    search: string,
    filterCategory: string,
  ) {
    try {
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
    } catch (error) {
      return cResponseData({ message: error.message as string, error: error });
    }
  }

  async updateReceiptsData(id: string, dto: UpdateReceiptDto) {
    const { vendor, amount, date, category } = dto;
    try {
      await this.prisma.receipt.update({
        where: { id },
        data: {
          vendor,
          amount,
          date,
          categoryId: category,
          notes: dto.notes,
        },
      });
      return cResponseData({ message: 'Receipt updated successfully' });
    } catch (error) {
      return cResponseData({ message: error.message as string, error: error });
    }
  }

  async deleteReceiptsData(id: string) {
    try {
      await this.prisma.receipt.delete({
        where: { id },
      });
      return cResponseData({ message: 'Receipt deleted successfully' });
    } catch (error) {
      return cResponseData({ message: error.message as string, error: error });
    }
  }
}
