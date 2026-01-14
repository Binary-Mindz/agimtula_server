import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/config/database/prisma.service';
import { cResponseData } from 'src/common/cResponse';
import { ExceptionFactory } from 'src/common/exception-factory';

@Injectable()
export class PermissionService {
  constructor(private prisma: PrismaService) { }

  async assignRolePermission(
    role: string,
    moduleName: string,
    grantedBy: string,
  ) {
    try {
      if (!role || !moduleName || !grantedBy) {
        throw ExceptionFactory.custom('VALIDATION_ERROR', 'Role, module name, and grantedBy are required');
      }

      const module = await this.prisma.module.findUnique({
        where: { name: moduleName },
      });

      if (!module) {
        throw ExceptionFactory.notFound('Module');
      }

      const permission = await this.prisma.roleModulePermission.upsert({
        where: {
          role_moduleId: {
            role: role as any,
            moduleId: module.id,
          },
        },
        create: {
          role: role as any,
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
        message: `Permission granted to ${role} role for ${moduleName} module`,
        data: permission,
      });
    } catch (error) {
      console.error('Assign role permission error:', error);
      throw ExceptionFactory.custom(
        'DATABASE_ERROR',
        'Failed to assign role permission'
      );
    }
  }


  async revokeRolePermission(role: string, moduleName: string) {
    try {
      if (!role || !moduleName) {
        throw ExceptionFactory.custom('VALIDATION_ERROR', 'Role and module name are required');
      }

      const module = await this.prisma.module.findUnique({
        where: { name: moduleName },
      });

      if (!module) {
        throw ExceptionFactory.notFound('Module');
      }

      const result = await this.prisma.roleModulePermission.updateMany({
        where: {
          role: role as any,
          moduleId: module.id,
        },
        data: {
          isEnabled: false,
        },
      });

      return cResponseData({
        success: true,
        message: `Permission revoked from ${role} role for ${moduleName} module`,
        data: { affectedRecords: result.count },
      });
    } catch (error) {
      console.error('Revoke role permission error:', error);
      throw ExceptionFactory.custom(
        'DATABASE_ERROR',
        'Failed to revoke role permission'
      );
    }
  }


  async getRolePermissions(role: string) {
    try {
      if (!role) {
        throw ExceptionFactory.custom('VALIDATION_ERROR', 'Role is required');
      }

      const permissions = await this.prisma.roleModulePermission.findMany({
        where: { role: role as any, isEnabled: true },
        include: {
          module: {
            select: {
              id: true,
              name: true,
              displayName: true,
              description: true,
            },
          },
        },
      });

      return cResponseData({
        success: true,
        message: `Permissions retrieved for ${role} role`,
        data: {
          role,
          permissions,
          totalPermissions: permissions.length,
        },
      });
    } catch (error) {
      console.error('Get role permissions error:', error);
      throw ExceptionFactory.custom(
        'DATABASE_ERROR',
        'Failed to retrieve role permissions'
      );
    }
  }


  async getAllRolesWithPermissions() {
    try {
      const roles = ['ADMIN', 'USER', 'ACCOUNTANT'];
      const result = await Promise.all(
        roles.map(async (role) => {
          const permissions = await this.prisma.roleModulePermission.findMany({
            where: { role: role as any, isEnabled: true },
            include: {
              module: {
                select: {
                  name: true,
                  displayName: true,
                },
              },
            },
          });
          return {
            role,
            permissions,
            totalPermissions: permissions.length,
          };
        }),
      );

      return cResponseData({
        success: true,
        message: 'All roles with permissions retrieved successfully',
        data: result,
      });
    } catch (error) {
      console.error('Get all roles with permissions error:', error);
      throw ExceptionFactory.custom(
        'DATABASE_ERROR',
        'Failed to retrieve roles with permissions'
      );
    }
  }


  async hasRolePermission(role: string, moduleName: string): Promise<boolean> {
    try {
      if (!role || !moduleName) {
        return false;
      }

      const module = await this.prisma.module.findUnique({
        where: { name: moduleName },
      });

      if (!module) {
        return false;
      }

      const permission = await this.prisma.roleModulePermission.findUnique({
        where: {
          role_moduleId: {
            role: role as any,
            moduleId: module.id,
          },
        },
      });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return permission?.isEnabled ?? false;
    } catch (error) {
      console.error('Check role permission error:', error);
      return false;
    }
  }
}

