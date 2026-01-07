import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/config/database/prisma.service';
import { ValidateAccountantAccess } from '../validate-accountant-access';
import { cResponseData } from 'src/common/cResponse';

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
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      console.log(error);

      return cResponseData({
        message: 'Failed to fetch sales invoices data',
        success: false,
      });
    }
  }

  async getSalesInvoices(accountantId: string, userId: string) {
    try {
      await this.validateAccountant.validate(userId, accountantId);

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
        data: invoices,
      });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      return cResponseData({
        success: false,
        message: 'Failed to fetch sales invoices',
      });
    }
  }
}
