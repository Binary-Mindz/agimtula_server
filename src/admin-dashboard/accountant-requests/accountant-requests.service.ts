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
  async getAccountantRequests() {
    const requests = await this.prisma.accountantRequest.findMany({
      where: {
        status: 'PENDING',
      },
    });

    return cResponseData({
      data: requests,
      message: 'Accountant requests fetched successfully',
    });
  }

  async approveAccountantRequest(accountantId: string, requestId: string) {
    try {
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
          id: approved.userId,
        },
        data: {
          haveAccountant: true,
          accountantId: accountantId,
        },
      });

      return cResponseData({
        data: approved,
        message: 'Accountant request approved successfully',
      });
    } catch (error) {
      console.error('Database error:', error);
      throw new Error(`Failed to approve accountant request: ${error.message}`);
    }
  }

  async rejectAccountantRequest(requestId: string) {
    try {
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
    } catch (error) {
      console.error('Database error:', error);
      throw new Error(`Failed to reject accountant request: ${error.message}`);
    }
  }
}
