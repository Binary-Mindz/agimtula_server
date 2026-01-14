import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/config/database/prisma.service';
import { ValidateAccountantAccess } from '../validate-accountant-access';
import { cResponseData } from 'src/common/cResponse';

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly validateAcc: ValidateAccountantAccess,
  ) {}

  async salesReports(userId: string, accountantId: string) {
    try {
      await this.validateAcc.validate(userId, accountantId);

      const salesReports = await this.prisma.invoice.findMany({
        where: {
          userId,
          invoiceSource: 'MANUAL',
        },
        select: {
          id: true,
          invoiceNo: true,
          issueDate: true,
          companyName: true,
          totalAmount: true,
          vat: true,
          invoiceSource: true,
          isPaid: true,
          createdAt: true,
        },
      });

      if (salesReports.length === 0) {
        throw new HttpException('No sales reports found', 404);
      }

      return cResponseData({
        success: true,
        message: 'Sales reports fetched successfully',
        data: salesReports,
      });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Get sales reports error:', error);
      throw new HttpException(
        'Failed to fetch sales reports',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    }
    
    async purchaseReports(userId: string, accountantId: string) {
      try {
        await this.validateAcc.validate(userId, accountantId);

        const purchaseReports = await this.prisma.invoice.findMany({
          where: {
            userId,
            invoiceSource: 'EMAIL',
          },
          select: {
            id: true,
            invoiceNo: true,
            issueDate: true,
            companyName: true,
            totalAmount: true,
            vat: true,
            invoiceSource: true,
            isPaid: true,
            createdAt: true,
          },
        });

        if (purchaseReports.length === 0) {
          throw new HttpException('No purchase reports found', 404);
        }

        return cResponseData({
          success: true,
          message: 'Purchase reports fetched successfully',
          data: purchaseReports,
        });
      } catch (error) {
        if (error instanceof HttpException) {
          throw error;
        }
        console.error('Get purchase reports error:', error);
        throw new HttpException(
          'Failed to fetch purchase reports',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
    async vatSummarry(userId: string, accountantId: string) {
      try {
        await this.validateAcc.validate(userId, accountantId);

        
      } catch (error) {
        if (error instanceof HttpException) {
          throw error;
        }
        console.error('Get VAT summary error:', error);
        throw new HttpException(
          'Failed to fetch VAT summary',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }

    async clientOverview(userId: string, accountantId: string) {
      try {
        await this.validateAcc.validate(userId, accountantId);

      } catch (error) {
        if (error instanceof HttpException) {
          throw error;
        }
        console.error('Get client overview error:', error);
        throw new HttpException(
          'Failed to fetch client overview',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
}
