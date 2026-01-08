import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { UploadReceiptDto } from './dto/upload-receipt.dto';
import { PrismaService } from 'src/config/database/prisma.service';
import { cResponseData } from 'src/common/cResponse';
import { UpdateReceiptDto } from './dto/update-receipt-dto';
import { NotFoundAppException } from 'src/common/app-exceptions';

@Injectable()
export class ReceiptsService {
  constructor(private prisma: PrismaService) { }

  async createReceiptCategory(name: string) {
    try {
      const receiptName = name.trim().toLowerCase();
      const rec = await this.prisma.receiptCategory.upsert({
        where: { name: receiptName },
        update: {},
        create: { name: receiptName },
      });

      return cResponseData({
        success: true,
        message: 'Receipt category created successfully',
        data: rec,
      });
    } catch (error) {
      console.error('Create receipt category error:', error);
      throw new HttpException('Failed to create receipt category', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getAllReceiptCategories() {
    try {
      const categories = await this.prisma.receiptCategory.findMany();

      return cResponseData({
        success: true,
        message: 'Receipt categories retrieved successfully',
        data: categories,
      });
    } catch (error) {
      console.error('Get receipt categories error:', error);
      throw new HttpException('Failed to retrieve receipt categories', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async deleteCategory(id: string) {
    try {
      const category = await this.prisma.receiptCategory.delete({
        where: { id },
      });

      return cResponseData({
        success: true,
        message: 'Category deleted successfully',
        data: category,
      });
    } catch (error) {
      console.error('Delete receipt category error:', error);
      throw new HttpException('Failed to delete receipt category', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async uploadReceipt(userId: string, dto: UploadReceiptDto) {
    try {
      const userExits = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!userExits) {
        throw new NotFoundAppException('User not found');
      }

      const categoryExits = await this.prisma.receiptCategory.findUnique({
        where: { id: dto.category },
      });

      if (!categoryExits) {
        throw new NotFoundAppException('Category not found');
      }

      const { vendor, amount, date, category, notes, receiptImage } = dto;

      const rec = await this.prisma.receipt.create({
        data: {
          vendor,
          amount,
          date,
          categoryId: category,
          receiptFileUrl: receiptImage,
          userId,
          notes: notes,
        },
      });

      return cResponseData({
        success: true,
        message: 'Receipt uploaded successfully',
        data: rec,
      });
    } catch (error) {
      if (error instanceof NotFoundAppException) {
        throw error;
      }
      console.error('Upload receipt error:', error);
      throw new HttpException('Failed to upload receipt', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getReceiptsData(userId: string, search: string, filterCategory: string) {
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
          receiptFileUrl: true,
          category: {
            select: {
              name: true,
            },
          },
        },
      });

      return cResponseData({
        success: true,
        message: receipts.length > 0 ? 'Receipts retrieved successfully' : 'No receipts found',
        data: receipts,
      });
    } catch (error) {
      console.error('Get receipts data error:', error);
      throw new HttpException('Failed to retrieve receipts', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async updateReceiptsData(id: string, dto: UpdateReceiptDto) {
    try {
      const { vendor, amount, date, category } = dto;
      const updatedReceipt = await this.prisma.receipt.update({
        where: { id },
        data: {
          vendor,
          amount,
          date,
          categoryId: category,
          notes: dto.notes,
        },
      });

      return cResponseData({
        success: true,
        message: 'Receipt updated successfully',
        data: updatedReceipt,
      });
    } catch (error) {
      console.error('Update receipt error:', error);
      throw new HttpException('Failed to update receipt', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async deleteReceiptsData(id: string) {
    try {
      const deletedReceipt = await this.prisma.receipt.delete({
        where: { id },
      });

      return cResponseData({
        success: true,
        message: 'Receipt deleted successfully',
        data: deletedReceipt,
      });
    } catch (error) {
      console.error('Delete receipt error:', error);
      throw new HttpException('Failed to delete receipt', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
