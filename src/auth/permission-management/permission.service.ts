import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/config/database/prisma.service';

@Injectable()
export class PermissionService {
  constructor(private prisma: PrismaService) { }

  // ============================================
  // USER MODULE ACCESS - Simple & Direct
  // ============================================

  async grantUserModuleAccess(
    userId: string,
    moduleName: string,
    grantedBy: string,
  ) {
    const module = await this.prisma.module.findUnique({
      where: { name: moduleName },
    });

    if (!module) {
      throw new NotFoundException(`Module '${moduleName}' not found`);
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

    return {
      message: `Module access granted to user for '${moduleName}'`,
      moduleAccess,
    };
  }

  async revokeUserModuleAccess(userId: string, moduleName: string) {
    const module = await this.prisma.module.findUnique({
      where: { name: moduleName },
    });

    if (!module) {
      throw new NotFoundException(`Module '${moduleName}' not found`);
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

    return {
      message: `Module access revoked from user for '${moduleName}'`,
      affectedRecords: result.count,
    };
  }

  async getUserModules(userId: string) {
    const result = await this.prisma.userModuleAccess.findMany({
      where: { userId, isEnabled: true },
      include: {
        module: true,
      },
    });
    return result;
  }



  async getAllModules() {
    return await this.prisma.module.findMany({
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
  }




}
