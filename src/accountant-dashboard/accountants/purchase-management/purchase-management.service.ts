import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { cResponseData } from 'src/common/cResponse';
import { PrismaService } from 'src/config/database/prisma.service';
import { ValidateAccountantAccess } from '../validate-accountant-access';
import { NotFoundAppException } from 'src/common/app-exceptions';

@Injectable()
export class PurchaseManagementService {
  constructor(
    private prisma: PrismaService,
    private validateAccountantAccess: ValidateAccountantAccess,
  ) {}

  async getPurchaseData(userId: string, accId: string) {
    try {
      await this.validateAccountantAccess.validate(userId, accId);

      const startDateOfThisMonth = new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        1,
      );
      const endDateOfThisMonth = new Date(
        new Date().getFullYear(),
        new Date().getMonth() + 1,
        0,
      );

      const [totalPurchaseThisMonth, vatToClaim, pendingReview, missingReport] =
        await Promise.all([
          this.prisma.invoice.aggregate({
            where: {
              userId,
              invoiceSource: 'EMAIL',
              createdAt: {
                lt: endDateOfThisMonth,
                gt: startDateOfThisMonth,
              },
            },
            _sum: {
              totalAmount: true,
            },
          }),
          this.prisma.invoice.aggregate({
            where: {
              userId,
              invoiceSource: 'EMAIL',
            },
            _sum: {
              vat: true,
            },
          }),
          this.prisma.invoice.count({
            where: {
              userId,
              invoiceSource: 'EMAIL',
              previewedByAccountant: false,
            },
          }),
          this.prisma.invoice.count({
            where: {
              userId,
              invoiceSource: 'EMAIL',
              haveAttachment: false,
            },
          }),
        ]);

      return cResponseData({
        success: true,
        message: 'Purchase data fetched successfully',
        data: {
          totalPurchaseThisMonth: Math.abs(
            Number(totalPurchaseThisMonth._sum.totalAmount) || 0,
          ),
          pendingReview: pendingReview || 0,
          missingReport: missingReport || 0,
          vatToClaim: Math.abs(Number(vatToClaim._sum.vat) || 0),
        },
      });
    } catch (error) {
      console.error('Get purchase data error:', error);
      throw new HttpException(
        'Failed to fetch purchase data',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getPurchaseHistory(
    userId: string,
    accId: string,
    page: number = 1,
    limit: number = 10,
    search?: string,
  ) {
    try {
      await this.validateAccountantAccess.validate(userId, accId);

      const user = await this.prisma.user.findFirst({
        where: {
          id: userId,
        },
        include: {
          profile: true,
        },
      });

      const skip = (page - 1) * limit;
      const take = limit;
      const whereClause = {
        userId,
      };
      if (search) {
        whereClause['OR'] = [
          { invoiceNumber: { contains: search } },
          { companyName: { contains: search } },
        ];
      }
      const purchases = await this.prisma.invoice.findMany({
        where: {
          ...whereClause,
          invoiceSource: 'EMAIL',
        },
        skip,
        take,
        orderBy: {
          createdAt: 'desc',
        },
      });

      return cResponseData({
        success: true,
        message: 'Purchase history fetched successfully',
        data: {
          purchases: purchases.map((purchase) => ({
            id: purchase.id,
            supplier: purchase.companyName,
            client: user?.profile?.firstName,
            date: purchase.issueDate,
            amount: purchase.totalAmount,
            vat: purchase.vat,
            status: purchase.previewedByAccountant,
          })),
        },
      });
    } catch (error) {
      console.error('Get purchase history error:', error);
      throw new HttpException(
        'Failed to fetch purchase history',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getPurchaseDetailedReport(userId: string, accId: string, id: string) {
    try {
      await this.validateAccountantAccess.validate(userId, accId);
      const isPurchaseInInvoiceDoc = await this.prisma.invoice.findFirst({
        where: {
          id,
          userId,
        },
      });

      if (!isPurchaseInInvoiceDoc) {
        throw new NotFoundAppException('Purchase not found');
      }

      await this.prisma.invoice.update({
        where: {
          id,
        },
        data: {
          previewedByAccountant: true,
        },
      });

      return cResponseData({
        success: true,
        message: 'Purchase detailed report fetched successfully',
        data: isPurchaseInInvoiceDoc,
      });
    } catch (error) {
      console.error('Get purchase detailed report error:', error);
      throw new HttpException(
        'Failed to fetch purchase detailed report',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async exportData(userId: string, accountantId: string) {
    try {
      await this.validateAccountantAccess.validate(userId, accountantId);

      const purchases = await this.prisma.invoice.findMany({
        where: {
          userId,
          invoiceSource: 'EMAIL',
        },
      });

      if (purchases.length === 0) {
        throw new NotFoundAppException('No purchase data found');
      }

      return cResponseData({
        success: true,
        message: 'Data exported successfully',
        data: purchases,
      });
    } catch (error) {
      if (error instanceof NotFoundAppException) {
        throw error;
      }
      console.error('Export data error:', error);
      throw new HttpException(
        'Failed to export data',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
