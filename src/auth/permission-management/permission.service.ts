import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from 'src/config/database/prisma.service';
import { cResponseData } from 'src/common/cResponse';

@Injectable()
export class PermissionService {
  constructor(private prisma: PrismaService) { }

  // ============ ROLE-BASED PERMISSIONS ============

  /**
   * Assign module permission to a role
   */
  async assignRolePermission(
    role: string,
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
      throw new HttpException(
        'Failed to assign role permission',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Revoke module permission from a role
   */
  async revokeRolePermission(role: string, moduleName: string) {
    try {
      const module = await this.prisma.module.findUnique({
        where: { name: moduleName },
      });

      if (!module) {
        throw new HttpException('Module not found', HttpStatus.NOT_FOUND);
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
      throw new HttpException(
        'Failed to revoke role permission',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get all permissions for a specific role
   */
  async getRolePermissions(role: string) {
    try {
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
      throw new HttpException(
        'Failed to retrieve role permissions',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get all roles with their permissions
   */
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
      throw new HttpException(
        'Failed to retrieve roles with permissions',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }


  async hasRolePermission(role: string, moduleName: string): Promise<boolean> {
    try {
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

