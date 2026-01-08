import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from 'src/config/database/prisma.service';
import { cResponseData } from 'src/common/cResponse';

@Injectable()
export class PermissionService {
  constructor(private prisma: PrismaService) {}

  async grantUserModuleAccess(
    userId: string,
    moduleName: string,
    grantedBy: string,
  ) {
    try {
      const module = await this.prisma.module.findUnique({
        where: { name: moduleName },
      });

      if (!module) {
        throw new HttpException('Module not found', HttpStatus.NOT_FOUND);
      }

      const moduleAccess = await this.prisma.userModuleAccess.upsert({
        where: {
          userId_moduleId: {
            userId,
            moduleId: module.id,
          },
        },
        create: {
          userId,
          moduleId: module.id,
          isEnabled: true,
          grantedBy,
        },
        update: {
          isEnabled: true,
          grantedBy,
          updatedAt: new Date(),
        },
      });

      return cResponseData({
        success: true,
        message: 'Module access granted successfully',
        data: moduleAccess,
      });
    } catch (error) {
      console.error('Grant module access error:', error);
      throw new HttpException(
        'Failed to grant module access',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async revokeUserModuleAccess(userId: string, moduleName: string) {
    try {
      const module = await this.prisma.module.findUnique({
        where: { name: moduleName },
      });

      if (!module) {
        throw new HttpException('Module not found', HttpStatus.NOT_FOUND);
      }

      const result = await this.prisma.userModuleAccess.updateMany({
        where: {
          userId,
          moduleId: module.id,
        },
        data: {
          isEnabled: false,
        },
      });

      return cResponseData({
        success: true,
        message: 'Module access revoked successfully',
        data: { affectedRecords: result.count },
      });
    } catch (error) {
      console.error('Revoke module access error:', error);
      throw new HttpException(
        'Failed to revoke module access',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getUserModules(userId: string) {
    try {
      const result = await this.prisma.userModuleAccess.findMany({
        where: { userId, isEnabled: true },
        include: {
          module: true,
        },
      });

      return cResponseData({
        success: true,
        message: 'User modules retrieved successfully',
        data: result,
      });
    } catch (error) {
      console.error('Get user modules error:', error);
      throw new HttpException(
        'Failed to retrieve user modules',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getAllModules() {
    try {
      const result = await this.prisma.module.findMany({
        include: {
          userModuleAccess: {
            where: { isEnabled: true },
            include: {
              user: {
                select: {
                  id: true,
                  role: true,
                },
              },
            },
          },
        },
      });

      return cResponseData({
        success: true,
        message: 'All modules retrieved successfully',
        data: result,
      });
    } catch (error) {
      console.error('Get all modules error:', error);
      throw new HttpException(
        'Failed to retrieve modules',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
