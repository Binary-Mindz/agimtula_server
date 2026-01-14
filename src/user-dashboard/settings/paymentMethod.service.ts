import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
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
    try {
      const existing = await this.prisma.paymentMethod.findFirst({
        where: {
          userId,
          acc_name: dto.accountName,
          bank_name: dto.bankName,
          iban: dto.iban,
        },
      });

      if (existing) {
        throw new HttpException(
          'Payment method already exists',
          HttpStatus.CONFLICT,
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

      return cResponseData({
        success: true,
        message: 'Payment method created successfully',
        data: paymentMethod,
      });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Create payment method error:', error);
      throw new HttpException(
        'Failed to create payment method',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async updatePaymentMethod(
    paymentMethodId: string,
    dto: UpdatePaymentMethodDto,
  ) {
    try {
      const existing = await this.prisma.paymentMethod.findUnique({
        where: { id: paymentMethodId },
      });

      if (!existing) {
        throw new HttpException(
          'Payment method not found',
          HttpStatus.NOT_FOUND,
        );
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

      const payment = await this.prisma.paymentMethod.update({
        where: { id: paymentMethodId },
        data: updateData,
      });

      return cResponseData({
        success: true,
        message: 'Payment method updated successfully',
        data: payment,
      });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Update payment method error:', error);
      throw new HttpException(
        'Failed to update payment method',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async makePaymentDefault(
    userId: string,
    paymentMethodId: string,
    makeDefault?: boolean,
  ) {
    try {
      const existing = await this.prisma.paymentMethod.findUnique({
        where: { id: paymentMethodId },
      });

      if (!existing || existing.userId !== userId) {
        throw new HttpException(
          'Payment method not found',
          HttpStatus.NOT_FOUND,
        );
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
        data: { isDefault },
      });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Make payment default error:', error);
      throw new HttpException(
        'Failed to update payment method',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getPaymentMethods(userId: string) {
    try {
      const paymentMethods = await this.prisma.paymentMethod.findMany({
        where: { userId },
      });

      return cResponseData({
        success: true,
        message: 'Payment methods retrieved successfully',
        data: paymentMethods,
      });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Get payment methods error:', error);
      throw new HttpException(
        'Failed to retrieve payment methods',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async deletePaymentMethods(userId: string, paymentMethodId: string) {
    try {
      const existing = await this.prisma.paymentMethod.findUnique({
        where: { id: paymentMethodId },
      });

      if (!existing || existing.userId !== userId) {
        throw new HttpException(
          'Payment method not found',
          HttpStatus.NOT_FOUND,
        );
      }

      await this.prisma.paymentMethod.delete({
        where: { id: paymentMethodId },
      });

      return cResponseData({
        success: true,
        message: 'Payment method deleted successfully',
      });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Delete payment method error:', error);
      throw new HttpException(
        'Failed to delete payment method',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
