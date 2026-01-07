import { Injectable } from '@nestjs/common';
import { cResponseData } from 'src/common/cResponse';
import { PrismaService } from 'src/config/database/prisma.service';
import { ValidateAccountantAccess } from '../validate-accountant-access';
import { CurrencyConverterService } from 'src/common/currency-converter.service';

@Injectable()
export class VatOverviewService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly validateAccess: ValidateAccountantAccess,
    private readonly currencyConverter: CurrencyConverterService,
  ) {}
  async getVatData(userId: string, accId: string) {
    await this.validateAccess.validate(userId, accId);
    try {
      const [salesDocuments, purchaseDocuments] = await Promise.all([
        this.prisma.financialDocument.findMany({
          where: {
            userId,
            isPaid: true,
            totalVat: {
              gt: 0,
            },
          },
          select: {
            totalVat: true,
            currency: true,
          },
        }),

        this.prisma.financialDocument.findMany({
          where: {
            userId,
            isPaid: true,
            totalVat: {
              lt: 0,
            },
          },
          select: {
            totalVat: true,
            currency: true,
          },
        }),
      ]);

      const totalSalesVat = salesDocuments.reduce(
        (sum, doc) => sum + this.currencyConverter.convertToEUR(Number(doc.totalVat), doc.currency),
        0
      );

      const totalPurchaseVat = purchaseDocuments.reduce(
        (sum, doc) => sum + this.currencyConverter.convertToEUR(Math.abs(Number(doc.totalVat)), doc.currency),
        0
      );

      return cResponseData({
        success: true,
        message: 'Vat data fetched successfully',
        data: {
          totalSalesVat: Math.round(totalSalesVat * 100) / 100,
          totalPurchaseVat: Math.round(totalPurchaseVat * 100) / 100,
          vatDue: Math.round((totalSalesVat - totalPurchaseVat) * 100) / 100,
          currency: 'EUR',
        },
      });

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      return cResponseData({
        message: 'Failed to fetch vat data',
        success: false,
      });
    }
  }
}
