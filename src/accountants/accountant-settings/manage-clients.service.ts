import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { cResponseData } from 'src/common/cResponse';
import { PrismaService } from 'src/config/database/prisma.service';

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
        throw new NotFoundException('No user found');
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
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      return cResponseData({
        message: 'User fetching failed',
        error: 'User fetching failed',
        success: false,
      });
    }
  }

  async addClient(clientId: string, accountantId: string) {
    try {
      const hasAcc = await this.prisma.user.findFirst({
        where: {
          id: clientId,
          haveAccountant: true,
        },
      });

      if (hasAcc) {
        throw new BadRequestException('This user already have an accountant');
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

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      return cResponseData({
        message: 'Accountant addition failed',
        error: 'Accountant addition failed',
        success: false,
      });
    }
  }

  async usersWithMe(accId: string) {
    try {
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
        throw new NotFoundException('No user found');
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
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      return cResponseData({
        message: 'User data fetching failed or not found',
        error: 'User data fetching failed or not found',
      });
    }
  }

  async removeFromMe(userId: string, accId: string) {
  try {
    // Find the user and ensure this user is linked to the current accountant
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        haveAccountant: true,
        accountantId: accId,
      },
    });

    if (!user) {
      return cResponseData({
        message: 'User not found or not associated with this accountant',
        error: 'User not found or not associated with this accountant',
        success: false,
      });
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return cResponseData({
      message: 'Failed to remove user from your clients',
      error: 'Failed to remove user from your clients',
      success: false,
    });
  }
  }
}
