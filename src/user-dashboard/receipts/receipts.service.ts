/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable, NotFoundException } from '@nestjs/common';
import { UploadReceiptDto } from './dto/upload-receipt.dto';
import uploadToCloudinary from 'src/config/cloudinary/cloudinary';
import { PrismaService } from 'src/config/database/prisma.service';
import { cResponseData } from 'src/common/cResponse';
import { UpdateReceiptDto } from './dto/update-receipt-dto';

@Injectable()
export class ReceiptsService {
  constructor(private prisma: PrismaService) { }

  // Receipt Category

  async createReceiptCategory(name: string) {
    const receiptName = name.trim().toLowerCase();

    try {
      const rec = await this.prisma.receiptCategory.upsert({
        where: { name: receiptName },
        update: {},
        create: { name: receiptName },
      });

      return cResponseData({
        message: 'Receipt category created successfully',
        data: rec,
      });
    } catch (error) {
      return cResponseData({
        message: 'Receipt category creation failed',
        error: 'Receipt category creation failed',
      });
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
      return cResponseData({
        message: 'Receipt categories retrieve failed',
        error: 'Receipt categories retrieve failed',
      });
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
      return cResponseData({
        message: 'Receipt categories delete failed',
        error: 'Receipt categories delete failed',
      });
    }
  }

  async uploadReceipt(
    userId: string,
    dto: UploadReceiptDto,
    file: string,
  ) {
    try {

      const userExits = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!userExits) {
        throw new NotFoundException('User not found');
      }

      const categoryExits = await this.prisma.receiptCategory.findUnique({
        where: { id: dto.category },
      });

      if (!categoryExits) {
        throw new NotFoundException('Category not found');
      }


      const { vendor, amount, date, category, notes } = dto;



      const rec = await this.prisma.receipt.create({
        data: {
          vendor,
          amount,
          date,
          categoryId: category,
          receiptFileUrl: file,
          userId,
          notes: notes,
        },
      });

      return cResponseData({
        message: 'Receipt uploaded successfully',
        data: rec,
      });
    } catch (error) {
      console.error(error);
      return cResponseData({
        message: "Receipt categories uploaded failed",
        error: "Receipt categories uploaded failed",
      });
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
          receipt_id: true,
          notes: true,
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
      return cResponseData({
        message: 'Receipt retrive failed',
        error: 'Receipt retrive failed',
      });
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
      return cResponseData({
        message: 'Receipt update failed',
        error: 'Receipt update failed',
      });
    }
  }

  async deleteReceiptsData(id: string) {
    try {
      await this.prisma.receipt.delete({
        where: { id },
      });
      return cResponseData({ message: 'Receipt deleted successfully' });
    } catch (error) {
      return cResponseData({
        message: 'Receipt delete failed',
        error: 'Receipt delete failed',
      });
    }
  }
}
