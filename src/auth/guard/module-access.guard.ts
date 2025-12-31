import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { MODULE_ACCESS_KEY } from '../decorators/module-access.decorator';
import { PrismaService } from 'src/config/database/prisma.service';
import { jwtPayload } from '../types/jwt-payload';

@Injectable()
export class ModuleAccessGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const moduleConfig = this.reflector.getAllAndOverride(MODULE_ACCESS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!moduleConfig) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: jwtPayload = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Extract module name
    const moduleName =
      typeof moduleConfig === 'string' ? moduleConfig : moduleConfig.moduleName;

    // Check module access
    const hasAccess = await this.checkModuleAccess(
      user.sub,
      user.role,
      moduleName as string,
    );

    if (!hasAccess) {
      throw new ForbiddenException(
        `You don't have access to ${moduleName} module`
      );
    }

    return true;
  }

  private async checkModuleAccess(
    userId: string,
    role: string,
    moduleName: string,
  ): Promise<boolean> {
    // Admin always has full access
    if (role === 'ADMIN') {
      return true;
    }

    // Get module by name
    const module = await this.prisma.module.findUnique({
      where: { name: moduleName },
    });

    if (!module) {
      return false;
    }

    // Check User Module Access
    const userModuleAccess = await this.prisma.userModuleAccess.findUnique({
      where: {
        userId_moduleId: {
          userId: userId,
          moduleId: module.id,
        },
      },
    });

    return !!(userModuleAccess && userModuleAccess.isEnabled);
  }
}
