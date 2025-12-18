import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/config/database/prisma.service';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { UpdatePaymentMethodDto } from './dto/update-payment-method.dto';
import { cResponseData } from 'src/common/cResponse';

@Injectable()
export class PaymentMethodService {
  constructor(private prisma: PrismaService) {}

  async createPaymentMethod(
    userId: string,
    dto: CreatePaymentMethodDto,
    makeDefault = false,
  ) {
    const existing = await this.prisma.paymentMethod.findFirst({
      where: {
        userId,
        acc_name: dto.accountName,
        bank_name: dto.bankName,
        iban: dto.iban,
      },
    });

    if (existing) {
      throw new ForbiddenException(
        'Payment method already exists for this user',
      );
    }

    if (makeDefault) {
      await this.prisma.paymentMethod.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const paymentMethod = await this.prisma.paymentMethod.create({
      data: {
        acc_name: dto.accountName,
        bank_name: dto.bankName,
        sort_code: dto.sortCode,
        iban: dto.iban,
        bic_swift: dto.bicSwift,

        default_payment_term: dto.defaultPaymentTerm,
        late_payment_fee: dto.latePaymentFee,
        payment_instructions: dto.paymentInstructions,

        isDefault: makeDefault,
        user: {
          connect: { id: userId },
        },
      },
    });

    return cResponseData({ data: paymentMethod });
  }

  async updatePaymentMethod(
    paymentMethodId: string,
    dto: UpdatePaymentMethodDto,
  ) {
    const existing = await this.prisma.paymentMethod.findUnique({
      where: { id: paymentMethodId },
    });

    if (!existing) {
      return null;
    }

    const updateData: any = {
      ...(dto.accountName && { acc_name: dto.accountName }),
      ...(dto.bankName && { bank_name: dto.bankName }),
      ...(dto.sortCode && { sort_code: dto.sortCode }),
      ...(dto.iban && { iban: dto.iban }),
      ...(dto.bicSwift && { bic_swift: dto.bicSwift }),
      ...(dto.defaultPaymentTerm && {
        default_payment_term: dto.defaultPaymentTerm,
      }),
      ...(dto.latePaymentFee !== undefined && {
        late_payment_fee: dto.latePaymentFee,
      }),
      ...(dto.paymentInstructions && {
        payment_instructions: dto.paymentInstructions,
      }),
    };

    if (dto.isDefault !== undefined) {
      updateData.isDefault = !existing.isDefault;
    }

    const payment = this.prisma.paymentMethod.update({
      where: { id: paymentMethodId },
      data: updateData,
    });

    return cResponseData({
      data: payment,
    });
  }

  async makePaymentDefault(
    userId: string,
    paymentMethodId: string,
    makeDefault?: boolean,
  ) {
    const existing = await this.prisma.paymentMethod.findUnique({
      where: { id: paymentMethodId },
    });

    if (!existing || existing.userId !== userId) {
      return { success: false, message: 'Payment method not found' };
    }

    let isDefault: boolean;

    if (makeDefault !== undefined) {
      isDefault = makeDefault;
      if (makeDefault) {
        await this.prisma.paymentMethod.updateMany({
          where: { userId, id: { not: paymentMethodId } },
          data: { isDefault: false },
        });
      }
    } else {
      isDefault = !existing.isDefault;
    }

    await this.prisma.paymentMethod.update({
      where: { id: paymentMethodId },
      data: { isDefault },
    });

    return cResponseData({
      success: true,
      message: 'Payment method updated successfully',
    });
  }

  async getPaymentMethods(userId: string) {
    const paymentMethods = await this.prisma.paymentMethod.findMany({
      where: { userId },
    });

    if (!paymentMethods) {
      throw new Error('No payment methods found');
    }
    return cResponseData({ data: paymentMethods });
  }
}
