import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { cResponseData } from 'src/common/cResponse';
import { PrismaService } from 'src/config/database/prisma.service';
import {
  NotFoundAppException,
  ConflictAppException,
} from 'src/common/app-exceptions';

@Injectable()
export class ManageClients {
  constructor(private prisma: PrismaService) {}

  async getUsersWithoutAccountant() {
    try {
      const users = await this.prisma.user.findMany({
        where: {
          role: 'USER',
          haveAccountant: false,
        },
        select: {
          id: true,
          profile: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          email: {
            select: {
              email: true,
            },
          },
        },
      });

      if (users.length === 0) {
        throw new NotFoundAppException('No user found');
      }

      const data = users.map((user) => ({
        email: user.email?.email,
        name: user.profile?.firstName + ' ' + user.profile?.lastName,
        id: user.id,
      }));

      return cResponseData({
        message: 'User fetched successfully',
        data: data,
      });
    } catch (error) {
      if (error instanceof NotFoundAppException) {
        throw error;
      }
      console.error('Get users without accountant error:', error);
      throw new HttpException(
        'Failed to fetch users',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async addClient(clientId: string, accountantId: string) {
    try {
      if (!clientId || !accountantId) {
        throw new HttpException('Client ID and accountant ID are required', HttpStatus.BAD_REQUEST);
      }

      const client = await this.prisma.user.findUnique({
        where: { id: clientId },
      });

      if (!client) {
        throw new NotFoundAppException('Client not found');
      }

      const hasAcc = await this.prisma.user.findFirst({
        where: {
          id: clientId,
          haveAccountant: true,
        },
      });

      if (hasAcc) {
        throw new ConflictAppException('This user already have an accountant');
      }

      const addedAcc = await this.prisma.user.update({
        where: {
          id: clientId,
        },
        data: {
          haveAccountant: true,
          accountantId: accountantId,
        },
        select: {
          profile: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      return cResponseData({
        message: 'Accountant added successfully',
        data: {
          addedUser:
            addedAcc.profile?.firstName + ' ' + addedAcc.profile?.lastName,
        },
      });
    } catch (error) {
      if (error instanceof ConflictAppException) {
        throw error;
      }
      console.error('Add client error:', error);
      throw new HttpException(
        'Failed to add accountant',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async usersWithMe(accId: string) {
    try {
      if (!accId) {
        throw new HttpException('Accountant ID is required', HttpStatus.BAD_REQUEST);
      }

      const users = await this.prisma.user.findMany({
        where: {
          haveAccountant: true,
          accountantId: accId,
        },
        select: {
          profile: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          email: {
            select: {
              email: true,
            },
          },
          id: true,
          status: true,
        },
      });

      if (!users) {
        throw new NotFoundAppException('No user found');
      }

      const structuredData = users.map((user) => ({
        email: user.email?.email,
        name: `${user.profile?.firstName} ${user.profile?.lastName}`,
        status: user.status,
        id: user.id,
      }));

      return cResponseData({
        message: 'Users are fetched',
        data: structuredData,
      });
    } catch (error) {
      if (error instanceof NotFoundAppException) {
        throw error;
      }
      console.error('Get users with me error:', error);
      throw new HttpException(
        'Failed to fetch user data',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async removeFromMe(userId: string, accId: string) {
    try {
      if (!userId || !accId) {
        throw new HttpException('User ID and accountant ID are required', HttpStatus.BAD_REQUEST);
      }

      const user = await this.prisma.user.findFirst({
        where: {
          id: userId,
          haveAccountant: true,
          accountantId: accId,
        },
      });

      if (!user) {
        throw new NotFoundAppException(
          'User not found or not associated with this accountant',
        );
      }

      // Update the user to remove accountant link
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          haveAccountant: false,
          accountantId: null,
        },
      });

      return cResponseData({
        message: 'User has been successfully removed from your clients.',
        data: { id: userId },
        success: true,
      });
    } catch (error) {
      if (error instanceof NotFoundAppException) {
        throw error;
      }
      console.error('Remove from me error:', error);
      throw new HttpException(
        'Failed to remove user from clients',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
