import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { cResponseData } from 'src/common/cResponse';
import { PrismaService } from 'src/config/database/prisma.service';
import { CreateUserManagementDto } from './dto/create-user-management.dto';
import * as bcrypt from 'bcrypt';
import { SmtpMailService } from 'src/config/smtp-mail/smtp-mail.service';

@Injectable()
export class UserManagementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailer: SmtpMailService,
  ) {}

  async findAllUsers(
    page: number = 1,
    limit: number = 10,
    search?: string,
    planFilter?: string,
    isActive?: boolean,
  ) {
    try {
      const skip = (page - 1) * limit;
      const where: any = {};

      // Search filter
      if (search) {
        where.OR = [
          {
            email: {
              email: {
                contains: search,
                mode: 'insensitive',
              },
            },
          },
          {
            profile: {
              firstName: {
                contains: search,
                mode: 'insensitive',
              },
            },
          },
          {
            profile: {
              lastName: {
                contains: search,
                mode: 'insensitive',
              },
            },
          },
        ];
      }

      // Plan filter
      if (planFilter) {
        where.userSubscriptionPlan = {
          planName: {
            contains: planFilter,
            mode: 'insensitive',
          },
        };
      }

      // Active status filter
      if (isActive !== undefined) {
        where.status = isActive;
      }

      // Exclude deleted users
      where.isDeleted = false;

      const [users, total] = await Promise.all([
        this.prisma.user.findMany({
          where,
          skip,
          take: limit,
          orderBy: { created_at: 'desc' },
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
                isActive: true,
                expiredAt: true,
              },
            },
            created_at: true,
          },
        }),
        this.prisma.user.count({ where }),
      ]);

      const userData = users.map((user) => ({
        id: user.id,
        email: user.email?.email || '',
        role: user.role,
        status: user.status,
        profile: user.profile
          ? {
              id: user.profile.id,
              firstName: user.profile.firstName,
              lastName: user.profile.lastName,
              profilePicture: user.profile.profilePicture,
            }
          : null,
        userSubscriptionPlan: user.userSubscriptionPlan
          ? {
              id: user.userSubscriptionPlan.id,
              planName: user.userSubscriptionPlan.planName,
              isActive: user.userSubscriptionPlan.isActive,
              expiredAt: user.userSubscriptionPlan.expiredAt,
            }
          : null,
        created_at: user.created_at,
      }));

      return cResponseData({
        message: 'Users fetched successfully',
        data: {
          userData,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalRecords: total,
            limit,
            hasNext: page < Math.ceil(total / limit),
            hasPrev: page > 1,
          },
        },
      });
    } catch (error) {
      console.error('Find all users error:', error);
      throw new HttpException(
        'Failed to fetch users',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async createUser(dto: CreateUserManagementDto) {
    try {
      const isUser = await this.prisma.user.findFirst({
        where: {
          email: {
            email: dto.email,
          },
        },
      });

      if (isUser) {
        throw new HttpException('User already exists', HttpStatus.CONFLICT);
      }

      const random = Math.floor(100000 + Math.random() * 900000);

      const randomPass = `pass_${random}`;

      const hashedPass = await bcrypt.hash(randomPass, 10);

      const user = await this.prisma.user.create({
        data: {
          password: hashedPass,
          email: {
            create: {
              email: dto.email,
            },
          },
          role: 'USER',
          status: true,
          profile: {
            create: {
              firstName: dto.firstName,
              lastName: dto.lastName,
              phone: dto.phone,
            },
          },
          businessInfo: {
            create: {
              address1: dto.address,
              companyName: dto.company,
            },
          },
        },
        select: {
          profile: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          email: {
            select: { email: true },
          },
        },
      });

      await this.mailer.sendMail(
        dto.email,
        'Welcome to Agimtula',
        `
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 10px; text-align: center;">
          <h1 style="color: #333;">Welcome to Agimtula</h1>
          <p style="color: #666;">Your account has been created successfully.</p>
          <p style="color: #666;">Your temporary password is: <strong>${randomPass}</strong></p>
          <p style="color: #666;">Please change your password after logging in.</p>
          <p style="color: #666;">Thank you for joining Agimtula!</p>
        </div> 
        `,
      );

      return cResponseData({
        success: true,
        message: 'User created successfully',
        data: {
          name: `${user.profile?.firstName} ${user.profile?.lastName}`,
          email: user.email?.email,
        },
      });
    } catch (error) {
      console.error(error);
      throw new HttpException(
        'Failed to create user',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async updateStatus(userId: string, status: boolean) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId, isDeleted: false },
        select: { status: true },
      });

      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: { status },
        select: { status: true },
      });

      return cResponseData({
        success: true,
        message: 'User status updated successfully',
        data: {
          status: updatedUser.status,
        },
      });
    } catch (error) {
      console.error(error);
      throw new HttpException(
        'Failed to update user status',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async updateRole(userId: string, role: 'USER' | 'ACCOUNTANT') {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId, isDeleted: false },
      });

      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: { role },
        select: { role: true },
      });

      return cResponseData({
        success: true,
        message: 'User role updated successfully',
        data: {
          role: updatedUser.role,
        },
      });
    } catch (error) {
      console.error(error);
      throw new HttpException(
        'Failed to update user role',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async deleteAccount(userId: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId, isDeleted: false },
      });

      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      await this.prisma.user.update({
        where: { id: userId },
        data: {
          isDeleted: true,
        },
      });

      return cResponseData({
        success: true,
        message: 'User deleted successfully',
      });
    } catch (error) {
      console.error(error);
      throw new HttpException(
        'Failed to delete user',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
