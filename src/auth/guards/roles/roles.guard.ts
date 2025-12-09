import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { role_str } from 'src/auth/decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const roles = this.reflector.getAllAndOverride(role_str, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!roles) {
      return true;
    }

    const user = context.switchToHttp().getRequest().user;

    if (!user) {
      return false;
    }

    const isAuthorized: boolean = roles.some((r: any) => user.role === r);

    if (!isAuthorized) {
      throw new ForbiddenException(
        `Access denied. Required role(s): ${roles.join(', ')}. Your role: ${user.role || 'none'}`,
      );
    }
    return true;
  }
}
