import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
// import { UpdatePaymentDto } from './dto/update-payment.dto';
import { PrismaService } from 'src/config/database/prisma.service';
import { cResponseData } from 'src/common/cResponse';

@Injectable()
export class PaymentService {
  constructor(private prisma: PrismaService) {}

  async buyPlan(
    userId: string,
    subscriptionPlanId: string,
    billingPeriod: 'MONTHLY' | 'YEARLY' = 'MONTHLY',
  ) {
    const getSubscriptionPlanData =
      await this.prisma.subscriptionPlan.findUnique({
        where: { id: subscriptionPlanId },
        include: {
          packagePricing: {
            where: {
              billingPeriod: billingPeriod,
            },
          },
        },
      });

    if (!getSubscriptionPlanData) {
      throw new NotFoundException('Subscription plan not found');
    }

    if (!getSubscriptionPlanData.isActive) {
      throw new BadRequestException('Subscription plan is inactive');
    }

    const pricing = getSubscriptionPlanData.packagePricing[0];

    const now = new Date();
    const expirationDate =
      billingPeriod === 'YEARLY'
        ? new Date(now.getFullYear() + 1, now.getMonth(), now.getDate())
        : new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

    const randomPid = `pi_${Math.random().toString(36).substring(2, 15)}`;

    const createPayment = await this.prisma.userSubscriptionPlanHistory.create({
      data: {
        UserId: userId,
        isLimitedInvoicePerMonth: pricing.isLimitedInvoicePerMonth ?? false,
        perMonthInvoiceCount: pricing.perMonthInvoiceCount ?? 0,
        realtimeImapChecking: pricing.invoiceAutoSyncIntervalIds,
        price: pricing.price,
        setupFee: pricing.setupFee,
        freeTrialDays: pricing.freeTrialDays,
        billingPeriod,
        expiredAt: expirationDate,
        subscriptionPlanPaymentStatus: {
          create: {
            pi_id: randomPid,
            totalAmount: pricing.price + pricing.setupFee,
            paymentStatus: 'PAID',
          },
        },
      },
      include: {
        subscriptionPlanPaymentStatus: true,
      },
    });

    if (createPayment.subscriptionPlanPaymentStatus?.paymentStatus === 'PAID') {
      await this.prisma.userSubscriptionPlan.create({
        data: {
          UserId: userId,
          isLimitedInvoicePerMonth: pricing.isLimitedInvoicePerMonth,
          perMonthInvoiceCount: pricing.perMonthInvoiceCount,
          price: pricing.price,
          setupFee: pricing.setupFee,
          freeTrialDays: pricing.freeTrialDays,
          realtimeImapChecking: pricing.invoiceAutoSyncIntervalIds,
          expiredAt: expirationDate,
          subscriptionPlanPaymentStatusId:
            createPayment.subscriptionPlanPaymentStatus.id,
        },
      });

      await this.prisma.subscriptionPlanPaymentStatus.update({
        where: {
          id: createPayment.subscriptionPlanPaymentStatus.id,
        },
        data: {
          subscriptionPlanHistoryId: createPayment.id,
        },
      });
    }

    return cResponseData({
      message: 'Subscription plan purchased successfully',
      data: createPayment,
    });
  }

  findAll() {
    return `This action returns all payment`;
  }

  findOne(id: number) {
    return `This action returns a #${id} payment`;
  }

  // update(id: number, updatePaymentDto: UpdatePaymentDto) {
  //   return `This action updates a #${id} payment`;
  // }

  remove(id: number) {
    return `This action removes a #${id} payment`;
  }
}
