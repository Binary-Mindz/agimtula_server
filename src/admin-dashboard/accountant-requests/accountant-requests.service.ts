import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
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
    try {
      const requests = await this.prisma.accountantRequest.findMany({
        where: {
          status: 'PENDING',
        },
      });

      return cResponseData({
        data: requests,
        message: 'Accountant requests fetched successfully',
      });
    } catch (error) {
      console.error('Get accountant requests error:', error);
      throw new HttpException(
        'Failed to fetch accountant requests',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
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
      console.error('Approve accountant request error:', error);
      throw new HttpException(
        'Failed to approve accountant request',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
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
      console.error('Reject accountant request error:', error);
      throw new HttpException(
        'Failed to reject accountant request',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
