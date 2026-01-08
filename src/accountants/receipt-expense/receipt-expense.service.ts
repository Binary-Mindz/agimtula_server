import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/config/database/prisma.service';
import { ValidateAccountantAccess } from '../validate-accountant-access';
import { cResponseData } from 'src/common/cResponse';

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
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      return cResponseData({
        message: 'Failed to fetch receipt and mileage data',
        success: false,
        data: null,
      });
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

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      return cResponseData({
        message: 'Failed to fetch receipt and mileage data',
        success: false,
        data: null,
      });
    }
  }

  async getData(userId: string, accId: string,expenseId:string) {
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
        throw new Error('Receipt or mileage not found');
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

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      return cResponseData({
        message: 'Failed to fetch data',
        success: false,
        data: null,
      })
    }
  }
}
