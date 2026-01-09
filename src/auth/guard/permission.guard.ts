import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from 'src/config/database/prisma.service';
import { jwtPayload } from '../types/jwt-payload';
import { ExceptionFactory } from 'src/common/exception-factory';

export const RequiredPermission = Reflector.createDecorator<string>();

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get the required permission from decorator
    const requiredModule = this.reflector.get(RequiredPermission, context.getHandler());

    // If no permission is required, allow access
    if (!requiredModule) {
      return true;
    }

    // Get the request and user
    const request = context.switchToHttp().getRequest();
    const user = request.user as jwtPayload;

    if (!user) {
      throw ExceptionFactory.unauthorized('User not found');
    }

    // ADMIN users have access to all modules
    if (user.role === 'ADMIN') {
      return true;
    }

    // Check if the user's role has permission for this module
    try {
      const hasPermission = await this.checkRolePermission(
        user.role,
        requiredModule,
      );

      if (!hasPermission) {
        throw ExceptionFactory.forbidden(
          `${user.role} role does not have permission for ${requiredModule} module`
        );
      }

      return true;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      console.error('Permission check error:', error);
      throw ExceptionFactory.custom(
        'INTERNAL_ERROR',
        'Error checking permissions'
      );
    }
  }


  private async checkRolePermission(
    role: string,
    moduleName: string,
  ): Promise<boolean> {
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
