import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { cResponseData } from 'src/common/cResponse';
import { PrismaService } from 'src/config/database/prisma.service';

@Injectable()
export class UserManagementService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllUsers() {
    try {
      const users = await this.prisma.user.findMany({
        select: {
          id: true,
          email: { select: { email: true } },
          role: true,
          status: true,
          profile: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profilePicture: true,
            },
          },
          userSubscriptionPlan: {
            select: {
              id: true,
              planName: true,
            },
          },
          created_at: true,
        },
      });

      return cResponseData({
        data: users,
      });
    } catch (error) {
      console.error('Find all users error:', error);
      throw new HttpException(
        'Failed to fetch users',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
