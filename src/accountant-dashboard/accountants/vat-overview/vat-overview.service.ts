import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { cResponseData } from 'src/common/cResponse';
import { PrismaService } from 'src/config/database/prisma.service';
import { ValidateAccountantAccess } from '../validate-accountant-access';
import { CurrencyConverterService } from 'src/common/currency-converter.service';
import { InvoiceSource } from 'prisma/generated/prisma/enums';

@Injectable()
export class VatOverviewService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly validateAccess: ValidateAccountantAccess,
    private readonly currencyConverter: CurrencyConverterService,
  ) {}

  async getSummary(userId: string, accId: string) {
    try {
      await this.validateAccess.validate(userId, accId);

      const invoices = await this.prisma.invoice.findMany({
        where: {
          userId,
          isPaid: true,
          isDrafted: false,
        },
        select: {
          vat: true,
          invoiceSource: true,
        },
      });

      let totalSalesVat = 0;
      let totalPurchaseVat = 0;

      for (const invoice of invoices) {
        if (invoice.invoiceSource === InvoiceSource.MANUAL) {
          totalSalesVat += invoice.vat;
        }

        if (invoice.invoiceSource === InvoiceSource.EMAIL) {
          totalPurchaseVat += invoice.vat;
        }
      }

      const vatDue = totalSalesVat - totalPurchaseVat;

      return cResponseData({
        success: true,
        message: 'VAT summary fetched successfully',
        data: {
          totalSalesVat: Number(totalSalesVat.toFixed(2)),
          totalPurchaseVat: Number(totalPurchaseVat.toFixed(2)),
          vatDue: Number(vatDue.toFixed(2)),
          currency: 'EUR',
        },
      });
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

  async getBreakdown(userId: string, accId: string) {
    try {
      await this.validateAccess.validate(userId, accId);

      const invoices = await this.prisma.invoice.findMany({
        where: {
          userId,
          isPaid: true,
          isDrafted: false,
        },
        select: {
          vat: true,
          subTotal: true,
          invoiceSource: true,
        },
      });

      const breakdown = {
        sales: { amount: 0, vat: 0 },
        purchases: { amount: 0, vat: 0 },
        intraEU: { amount: 0, vat: 0 },
      };

      for (const inv of invoices) {
        if (inv.vat === 0) {
          breakdown.intraEU.amount += inv.subTotal;
          breakdown.intraEU.vat += 0;
          continue;
        }

        if (inv.invoiceSource === InvoiceSource.MANUAL) {
          breakdown.sales.amount += inv.subTotal;
          breakdown.sales.vat += inv.vat;
        }

        if (inv.invoiceSource === InvoiceSource.EMAIL) {
          breakdown.purchases.amount += inv.subTotal;
          breakdown.purchases.vat += inv.vat;
        }
      }

      return cResponseData({
        success: true,
        message: 'VAT breakdown fetched successfully',
        data: {
          vatOverview: [
            {
              category: 'Sales',
              amount: Number(breakdown.sales.amount.toFixed(2)),
              vatRate: 'Mixed',
              calculatedVat: Number(breakdown.sales.vat.toFixed(2)),
              notes: 'Goods & Services',
            },
            {
              category: 'Purchases',
              amount: Number(breakdown.purchases.amount.toFixed(2)),
              vatRate: 'Mixed',
              calculatedVat: Number(breakdown.purchases.vat.toFixed(2)),
              notes: 'Business Expenses',
            },
            {
              category: 'Intra-EU Purchases',
              amount: Number(breakdown.intraEU.amount.toFixed(2)),
              vatRate: '0%',
              calculatedVat: 0,
              notes: 'Reverse charge mechanism',
            },
          ],
          totalVatDue: Number(
            (
              breakdown.sales.vat -
              (breakdown.purchases.vat + breakdown.intraEU.vat)
            ).toFixed(2),
          ),
        },
      });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Get VAT breakdown error:', error);
      throw new HttpException(
        'Failed to fetch VAT breakdown',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getAllVatData(userId: string, accId: string) {
    try {
      const [summary, breakdown] = await Promise.all([
        this.getSummary(userId, accId),
        this.getBreakdown(userId, accId),
      ]);

      return cResponseData({
        success: true,
        message: 'VAT data fetched successfully',
        data: {
          summary: summary.data,
          breakdown: breakdown.data,
        },
      });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Get all VAT data error:', error);
      throw new HttpException(
        'Failed to fetch VAT data',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
