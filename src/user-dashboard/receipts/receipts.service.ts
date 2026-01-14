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
      if (error instanceof HttpException) {
        throw error;
      }
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
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Get receipt categories error:', error);
      throw new HttpException('Failed to retrieve receipt categories', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async deleteCategory(id: string) {
    try {
      if (!id) {
        throw new HttpException('Category ID is required', HttpStatus.BAD_REQUEST);
      }

      const category = await this.prisma.receiptCategory.findUnique({
        where: { id },
      });

      if (!category) {
        throw new HttpException('Category not found', HttpStatus.NOT_FOUND);
      }

      await this.prisma.receiptCategory.delete({
        where: { id },
      });

      return cResponseData({
        success: true,
        message: 'Category deleted successfully',
        data: category,
      });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Delete receipt category error:', error);
      throw new HttpException('Failed to delete receipt category', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async uploadReceipt(userId: string, dto: UploadReceiptDto) {
    try {
      const userExits = await this.prisma.user.findUnique({
        where: { id: userId, isDeleted: false },
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

  async getReceiptsData(
    userId: string,
    search?: string,
    filterCategory?: string,
    page: number = 1,
    limit: number = 10,
  ) {
    try {
      const skip = (page - 1) * limit;
      const query: any = { userId };

      if (search) {
        query.vendor = { contains: search, mode: 'insensitive' };
      }

      if (filterCategory) {
        query.category = { name: filterCategory };
      }

      const [receipts, totalRecords] = await Promise.all([
        this.prisma.receipt.findMany({
          where: {
            ...query,
            user: { isDeleted: false },
          },
          skip,
          take: limit,
          orderBy: { date: 'desc' },
        
        }),
        this.prisma.receipt.count({ 
          where: {
            ...query,
            user: { isDeleted: false },
          },
        }),
      ]);

      const totalPages = Math.ceil(totalRecords / limit);

      return cResponseData({
        success: true,
        message: receipts.length > 0 ? 'Receipts retrieved successfully' : 'No receipts found',
        data: {
          receipts,
          pagination: {
            currentPage: page,
            totalPages,
            totalRecords,
            limit,
            hasNext: page < totalPages,
            hasPrev: page > 1,
          },
        },
      });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Get receipts data error:', error);
      throw new HttpException('Failed to retrieve receipts', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async updateReceiptsData(id: string, dto: UpdateReceiptDto) {
    try {
      if (!id) {
        throw new HttpException('Receipt ID is required', HttpStatus.BAD_REQUEST);
      }

      const existing = await this.prisma.receipt.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new HttpException('Receipt not found', HttpStatus.NOT_FOUND);
      }

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
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Update receipt error:', error);
      throw new HttpException('Failed to update receipt', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async deleteReceiptsData(id: string) {
    try {
      if (!id) {
        throw new HttpException('Receipt ID is required', HttpStatus.BAD_REQUEST);
      }

      const existing = await this.prisma.receipt.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new HttpException('Receipt not found', HttpStatus.NOT_FOUND);
      }

      await this.prisma.receipt.delete({
        where: { id },
      });

      return cResponseData({
        success: true,
        message: 'Receipt deleted successfully',
        data: existing,
      });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Delete receipt error:', error);
      throw new HttpException('Failed to delete receipt', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
