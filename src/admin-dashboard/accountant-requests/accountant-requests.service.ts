import { Injectable } from '@nestjs/common';
import { cResponseData } from 'src/common/cResponse';
import { PrismaService } from 'src/config/database/prisma.service';

@Injectable()
export class AccountantRequestsService {
  constructor(private prisma: PrismaService) {}

  getAccountantIds() {
    return this.prisma.user.findMany({
      where: {
        role: 'ACCOUNTANT',
      },
    });
  }
  getAccountantRequests() {
    const requests = this.prisma.accountantRequest.findMany({
      where: {
        status: 'PENDING',
      },
    });

    return cResponseData({
      data: requests,
      message: 'Accountant requests fetched successfully',
    });
  }

  async approveAccountantRequest(
    userId: string,
    accountantId: string,
    requestId: string,
  ) {
    const approved = await this.prisma.accountantRequest.update({
      where: {
        id: requestId,
      },
      data: {
        status: 'APPROVED',
      },
    });

    await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        haveAccountant: true,
        accountantId,
      },
    });

    return cResponseData({
      data: approved,
      message: 'Accountant request approved successfully',
    });
  }

  async rejectAccountantRequest(requestId: string) {
    const rejected = await this.prisma.accountantRequest.update({
      where: {
        id: requestId,
      },
      data: {
        status: 'REJECTED',
      },
    });

    return cResponseData({
      message: 'Accountant request rejected',
      data: rejected,
    });
  }
}
