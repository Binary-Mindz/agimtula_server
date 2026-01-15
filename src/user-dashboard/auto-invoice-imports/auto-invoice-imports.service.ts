import { HttpException, Injectable } from '@nestjs/common';
import { ImapEmailConnectionDto } from './dto/imap-email-connection.dto';
import { ValidationException } from 'src/common/app-exceptions';
import { PrismaService } from 'src/config/database/prisma.service';
import { cResponseData } from 'src/common/cResponse';
import { formatDistanceToNow } from 'date-fns';

@Injectable()
export class AutoInvoiceImportsService {
  constructor(private prisma: PrismaService) {}

  updateImapConnection(data: ImapEmailConnectionDto) {
    if (!data) {
      throw new ValidationException('Invalid IMAP connection data');
    }
    return {
      message: 'IMAP connection updated successfully',
      data,
    };
  }

  async autoInvoiceRetrivalDashboard(userId: string) {
    try {
      const thisMonth = new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        1,
      );

      const [thisMonthInvoiceCount, imapEmail, supplierCount, isConnected] =
        await Promise.all([
          this.prisma.invoice.count({
            where: {
              userId,
              createdAt: {
                gte: thisMonth,
              },
              invoiceSource: 'EMAIL',
            },
          }),
          this.prisma.imapConfiguration.findFirst({
            where: {
              userId,
            },
            select: {
              username: true,
            },
          }),

          this.prisma.invoice.findMany({
            where: {
              userId,
              invoiceSource: 'EMAIL',
            },
            select: {
              vendor: true,
            },
            distinct: ['vendor'],
          }),

          this.prisma.imapConfiguration.findFirst({
            where: {
              userId,
            },
            select: {
              connect: true,
            },
          }),
        ]);

      const data = {
        thisMonthInvoiceCount,
        imapEmail: imapEmail?.username,
        supplierCount: supplierCount.length,
        isConnected,
      };

      return cResponseData({
        message: 'Auto invoice retrival dashboard data fetched successfully',
        data,
        success: true,
      });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to fetch auto invoice retrival dashboard data',
        500,
      );
    }
  }

  async autoImportedInvoices(userId: string, page = 1, limit = 10) {
    try {
      const skip = (page - 1) * limit;

      const [invoices, total] = await Promise.all([
        this.prisma.invoice.findMany({
          where: {
            userId,
            invoiceSource: 'EMAIL',
          },
          orderBy: {
            createdAt: 'desc',
          },
          skip,
          take: limit,
        }),

        this.prisma.invoice.count({
          where: {
            userId,
            invoiceSource: 'EMAIL',
          },
        }),
      ]);

      return cResponseData({
        message: 'Auto imported invoices fetched successfully',
        data: {
          items: invoices.map((invoice) => ({
            id: invoice.id,
            source: invoice.invoiceSource,
            vendor: invoice.vendor,
            invoiceNo: invoice.invoiceNo,
            invoiceDate: invoice.createdAt,
            amount: invoice.totalAmount,
            status: invoice.haveAttachment ? 'imported' : 'failed',
          })),
          pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException('Failed to fetch auto imported invoices', 500);
    }
  }
  async viewOrDownload(invoiceId: string, userId: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: {
          id: userId,
        },
      });
      if (!user) {
        throw new HttpException('User not found', 404);
      }

      const invoice = await this.prisma.invoice.findUnique({
        where: {
          id: invoiceId,
        },
      });

      if (!invoice) {
        throw new HttpException('Invoice not found', 404);
      }

      return cResponseData({
        message: 'Invoice fetched successfully',
        data: invoice,
        success: true,
      });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Failed to view or download invoice', 400);
    }
  }

  async recentFiveData(userId: string) {
    try {
      const imapConfig = await this.prisma.imapConfiguration.findUnique({
        where: {
          userId: userId,
        },
      });

      if (!imapConfig) {
        throw new HttpException("You didn't configured IMAP", 400);
      }

      const recentFiveData = await this.prisma.imapSyncHistory.findMany({
        where: {
          imapConfigurationId: imapConfig.id,
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      });

      if (recentFiveData.length === 0) {
        throw new HttpException('No Data Found', 404);
      }

      return cResponseData({
        message: 'Recent 5 data fetched',
        data: recentFiveData.map((data) => ({
          invoiceCount: data.invoicesFound,
          timeAgo: formatDistanceToNow(new Date(data.createdAt ), {
            addSuffix: true,
          }),
        })),
      });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException('Failed to retrive recent data', 400);
    }
  }
}
