import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from 'src/config/database/prisma.service';
import { ValidateAccountantAccess } from '../validate-accountant-access';
import { cResponseData } from 'src/common/cResponse';
import { NotFoundAppException } from 'src/common/app-exceptions';

@Injectable()
export class ReceiptExpenseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly validateAccAccess: ValidateAccountantAccess,
  ) {}

  async getTotalExpense(userId: string, accountantId: string) {
    try {
      await this.validateAccAccess.validate(userId, accountantId);

      const [totalReceiptThisMonths, totalMileageThisMonths] =
        await Promise.all([
          this.prisma.receipt.aggregate({
            where: {
              userId,
              createdAt: {
                lte: new Date(),
                gte: new Date(
                  new Date().getFullYear(),
                  new Date().getMonth(),
                  1,
                ),
              },
            },
            _sum: { amount: true },
          }),
          this.prisma.mileage.aggregate({
            where: {
              userId,
              createdAt: {
                lte: new Date(),
                gte: new Date(
                  new Date().getFullYear(),
                  new Date().getMonth(),
                  1,
                ),
              },
            },
            _sum: { amount: true },
          }),
        ]);

      const totalAmount =
        (totalReceiptThisMonths._sum.amount || 0) +
          (totalMileageThisMonths._sum.amount || 0) || 0;

      return cResponseData({
        message: 'Receipt and mileage data fetched successfully',
        success: true,
        data: {
          totalAmount,
        },
      });
    } catch (error) {
      console.error('Get total expense error:', error);
      throw new HttpException(
        'Failed to fetch receipt and mileage data',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getReceiptAndMileage(
    userId: string,
    accountantId: string,
    page: number = 1,
    limit: number = 10,
    search?: string,
    sortBy: string = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc',
  ) {
    try {
      await this.validateAccAccess.validate(userId, accountantId);

      const user = await this.prisma.user.findUnique({
        where: {
          id: userId,
        },
        include: {
          profile: true,
        },
      });

      const skip = (page - 1) * limit;
      const receiptSearchFilter = search
        ? {
            OR: [
              { vendor: { contains: search, mode: 'insensitive' as const } },
              { notes: { contains: search, mode: 'insensitive' as const } },
              {
                category: {
                  name: { contains: search, mode: 'insensitive' as const },
                },
              },
            ],
          }
        : {};

      const mileageSearchFilter = search
        ? {
            OR: [
              {
                startLocation: {
                  contains: search,
                  mode: 'insensitive' as const,
                },
              },
              {
                endLocation: { contains: search, mode: 'insensitive' as const },
              },
              { purpose: { contains: search, mode: 'insensitive' as const } },
              { vehicle: { contains: search, mode: 'insensitive' as const } },
              { notes: { contains: search, mode: 'insensitive' as const } },
              { tripType: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {};

      const [receipts, mileage, totalReceipts, totalMileage] =
        await Promise.all([
          this.prisma.receipt.findMany({
            where: {
              userId,
              ...receiptSearchFilter,
            },
            include: {
              category: true,
            },
            orderBy: {
              [sortBy]: sortOrder,
            },
          }),
          this.prisma.mileage.findMany({
            where: {
              userId,
              ...mileageSearchFilter,
            },
            orderBy: {
              [sortBy]: sortOrder,
            },
          }),
          this.prisma.receipt.count({
            where: {
              userId,
              ...receiptSearchFilter,
            },
          }),
          this.prisma.mileage.count({
            where: {
              userId,
              ...mileageSearchFilter,
            },
          }),
        ]);

      // Add type identifier and combine data
      const combinedData = [
        ...receipts.map((item) => ({ ...item, type: 'receipt' })),
        ...mileage.map((item) => ({ ...item, type: 'mileage' })),
      ];

      // Sort combined data by createdAt
      combinedData.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      });

      // Apply pagination to combined data
      const paginatedData = combinedData.slice(skip, skip + limit);
      const totalRecords = totalReceipts + totalMileage;
      const totalPages = Math.ceil(totalRecords / limit);

      return cResponseData({
        message: 'Receipt and mileage data fetched successfully',
        success: true,
        data: {
          paginatedData: paginatedData.map((item) => ({
            client: user?.profile?.firstName,
            name:
              item.type === 'receipt'
                ? (item as any).vendor
                : `${(item as any).name}`,
            date: item.date || item.createdAt,
            expenseType:
              item.type === 'receipt'
                ? (item as any).category?.name
                : (item as any).tripType,
            amount: item.amount,
            source: item.type === 'receipt' ? 'Receipt' : 'Mileage',
          })),
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
      console.error('Get receipt and mileage error:', error);
      throw new HttpException(
        'Failed to fetch receipt and mileage data',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getData(userId: string, accId: string, expenseId: string) {
    try {
      await this.validateAccAccess.validate(userId, accId);

      const receipt = await this.prisma.receipt.findFirst({
        where: {
          id: expenseId,
          userId,
        },
        include: {
          category: true,
        },
      });
      const mileage = await this.prisma.mileage.findFirst({
        where: {
          id: expenseId,
          userId,
        },
      });

      if (!receipt || !mileage) {
        throw new NotFoundAppException('Receipt or mileage not found');
      }

      return cResponseData({
        message: 'Receipt and mileage data fetched successfully',
        success: true,
        data: {
          receipt: receipt
            ? {
                client: receipt.vendor,
                date: receipt.date,
                expenseType: receipt.category?.name,
                amount: receipt.amount,
                source: 'Receipt',
              }
            : null,
          mileage: mileage
            ? {
                client: mileage.name,
                date: mileage.date,
                expenseType: mileage.tripType,
                amount: mileage.amount,
                source: 'Mileage',
              }
            : null,
        },
      });
    } catch (error) {
      if (error instanceof NotFoundAppException) {
        throw error;
      }
      console.error('Get data error:', error);
      throw new HttpException(
        'Failed to fetch data',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async exportData(userId: string, accId: string) {
    try {
      await this.validateAccAccess.validate(userId, accId);

      const receipts = await this.prisma.receipt.findMany({
        where: {
          userId,
        },
        include: {
          category: true,
        },
      });

      const mileage = await this.prisma.mileage.findMany({
        where: {
          userId,
        },
      });

      const combinedData = [
        ...receipts.map((item) => ({
          client: item.vendor,
          date: item.date,
          expenseType: item.category?.name,
          amount: item.amount,
          source: 'Receipt',
        })),
        ...mileage.map((item) => ({
          client: item.name,
          date: item.date,
          expenseType: item.tripType,
          amount: item.amount,
          source: 'Mileage',
        })),
      ];

      combinedData.sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateB - dateA;
      });

      return cResponseData({
        message: 'Receipt and mileage data fetched successfully',
        success: true,
        data: {
          combinedData,
        },
      });
    } catch (error) {
      console.error('Export data error:', error);
      throw new HttpException(
        'Failed to export receipt and mileage data',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
