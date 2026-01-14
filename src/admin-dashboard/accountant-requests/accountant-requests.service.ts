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
        isDeleted: false,
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
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Get accountant requests error:', error);
      throw new HttpException(
        'Failed to fetch accountant requests',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async approveAccountantRequest(accountantId: string, requestId: string) {
    try {
      if (!accountantId || !requestId) {
        throw new HttpException('Accountant ID and request ID are required', HttpStatus.BAD_REQUEST);
      }

      const request = await this.prisma.accountantRequest.findUnique({
        where: { id: requestId },
      });

      if (!request) {
        throw new HttpException('Request not found', HttpStatus.NOT_FOUND);
      }

      const approved = await this.prisma.accountantRequest.update({
        where: { id: requestId },
        data: { status: 'APPROVED' },
      });

      await this.prisma.user.update({
        where: { id: approved.userId },
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
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Approve accountant request error:', error);
      throw new HttpException(
        'Failed to approve accountant request',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async rejectAccountantRequest(requestId: string) {
    try {
      if (!requestId) {
        throw new HttpException('Request ID is required', HttpStatus.BAD_REQUEST);
      }

      const request = await this.prisma.accountantRequest.findUnique({
        where: { id: requestId },
      });

      if (!request) {
        throw new HttpException('Request not found', HttpStatus.NOT_FOUND);
      }

      const rejected = await this.prisma.accountantRequest.update({
        where: { id: requestId },
        data: { status: 'REJECTED' },
      });

      return cResponseData({
        message: 'Accountant request rejected',
        data: rejected,
      });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Reject accountant request error:', error);
      throw new HttpException(
        'Failed to reject accountant request',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
