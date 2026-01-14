import { HttpException, Injectable } from '@nestjs/common';
import { ImapEmailConnectionDto } from './dto/imap-email-connection.dto';
import { ValidationException } from 'src/common/app-exceptions';
import { PrismaService } from 'src/config/database/prisma.service';
import { cResponseData } from 'src/common/cResponse';

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

      const [
        thisMonthInvoiceCount,
        imapEmail,
        supplierCount,
        isConnected,
        autoImportedInvoices,
      ] = await Promise.all([
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
        this.prisma.invoice.findMany({
          where: {
            userId,
            invoiceSource: 'EMAIL',
          },
        }),
      ]);

      const data = {
        thisMonthInvoiceCount,
        imapEmail: imapEmail?.username,
        supplierCount: supplierCount.length,
        isConnected,
        autoImportedInvoices: autoImportedInvoices.map((invoice) => ({
          id: invoice.id,
          source: invoice.invoiceSource,
          vendor: invoice.vendor,
          invoiceNo: invoice.invoiceNo,
          invoiceDate: invoice.createdAt,
          amount: invoice.totalAmount,
          status: invoice.haveAttachment ? 'imported' : 'failed',
        })),
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
      throw new HttpException('Failed to view or download invoice', 500);
    }
  }
}
