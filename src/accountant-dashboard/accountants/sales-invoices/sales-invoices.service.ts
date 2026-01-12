import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from 'src/config/database/prisma.service';
import { ValidateAccountantAccess } from '../validate-accountant-access';
import { cResponseData } from 'src/common/cResponse';
import { NotFoundAppException } from 'src/common/app-exceptions';

@Injectable()
export class SalesInvoicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly validateAccountant: ValidateAccountantAccess,
  ) {}

  async getSalesInvoicesData(accountantId: string, userId: string) {
    try {
      await this.validateAccountant.validate(userId, accountantId);

      const [totalThisMonth, paidInvoices, pendingInvoices, overdueInvoices] =
        await Promise.all([
          this.prisma.invoice.aggregate({
            where: {
              userId,
              invoiceSource: 'MANUAL',
              createdAt: {
                gte: new Date(
                  new Date().getFullYear(),
                  new Date().getMonth(),
                  1,
                ),
                lte: new Date(
                  new Date().getFullYear(),
                  new Date().getMonth() + 1,
                  0,
                ),
              },
              dueDate: {
                lt: new Date(),
              },
            },
            _sum: {
              totalAmount: true,
            },
          }),

          this.prisma.invoice.count({
            where: {
              userId,
              isPaid: true,
              invoiceSource: 'MANUAL',
              dueDate: {
                lt: new Date(),
              },
            },
          }),

          this.prisma.invoice.count({
            where: {
              userId,
              isPaid: false,
              invoiceSource: 'MANUAL',
              dueDate: {
                lt: new Date(),
              },
            },
          }),

          this.prisma.invoice.count({
            where: {
              userId,
              invoiceSource: 'MANUAL',
              dueDate: {
                lt: new Date(),
              },
            },
          }),
        ]);

      return cResponseData({
        data: {
          totalThisMonth: Math.abs(
            Number(totalThisMonth._sum.totalAmount) || 0,
          ),
          paidInvoices,
          pendingInvoices,
          overdueInvoices,
        },
        success: true,
        message: 'Sales invoices data fetched successfully',
      });
    } catch (error) {
      console.error('Get sales invoices data error:', error);
      throw new HttpException(
        'Failed to fetch sales invoices data',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getSalesInvoices(accountantId: string, userId: string) {
    try {
      await this.validateAccountant.validate(userId, accountantId);

      const user = await this.prisma.user.findFirst({
        where: {
          id: userId,
        },
        include: {
          profile: true,
        },
      });

      const invoices = await this.prisma.invoice.findMany({
        where: {
          userId,
          invoiceSource: 'MANUAL',
        },
        include: {
          serviceAndItems: true,
          businessDatas: true,
        },
      });
      return cResponseData({
        message: 'Sales invoices fetched successfully',
        success: true,
        data: {
          invoices: invoices.map((invoice) => ({
            id: invoice.id,
            invoiceNo: invoice.invoiceNo,
            business: invoice.companyName,
            client: user?.profile?.firstName,
            date: invoice.issueDate,
            total: invoice.totalAmount,
            vat: invoice.vat,
            paymentStatus:
              invoice.dueDate && invoice.dueDate < new Date()
                ? 'Overdue'
                : invoice.isPaid
                  ? 'Paid'
                  : 'Pending',
          })),
        },
      });
    } catch (error) {
      console.error('Get sales invoices error:', error);
      throw new HttpException(
        'Failed to fetch sales invoices',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getData(userId: string, accountantId: string, salesId: string) {
    try {
      await this.validateAccountant.validate(userId, accountantId);

      const salesInvoice = await this.prisma.invoice.findFirst({
        where: {
          id: salesId,
          userId,
        },
        include: {
          serviceAndItems: true,
          businessDatas: true,
        },
      });

      return cResponseData({
        message: 'Sales invoice data fetched successfully',
        success: true,
        data: {
          ...salesInvoice,
          serviceAndItems: salesInvoice?.serviceAndItems.map((item) => ({
            ...item,
            total: item.qty * item.rate,
          })),
        },
      });
    } catch (error) {
      console.error('Get sales invoice data error:', error);
      throw new HttpException(
        'Failed to fetch sales invoice data',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async exportData(userId: string, accountantId: string) {
    try {
      await this.validateAccountant.validate(userId, accountantId);

      const salesInvoices = await this.prisma.invoice.findMany({
        where: {
          userId,
          invoiceSource: 'MANUAL',
        },
      });

      if (salesInvoices.length === 0) {
        throw new NotFoundAppException('No sales invoices found');
      }

      return cResponseData({
        message: 'Sales invoices exported successfully',
        success: true,
        data: salesInvoices,
      });
    } catch (error) {
      if (error instanceof NotFoundAppException) {
        throw error;
      }
      console.error('Export sales invoices error:', error);
      throw new HttpException(
        'Failed to export sales invoices',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
