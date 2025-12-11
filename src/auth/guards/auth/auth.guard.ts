import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as jwt from 'jsonwebtoken';
import { IS_PUBLIC_KEY } from 'src/auth/decorators/public.decorator';
import { ROLE_KEY } from 'src/auth/decorators/roles.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic && !requiredRoles) return true;

    if (!requiredRoles) return false;

    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer '))
      throw new UnauthorizedException('No token provided');

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
      request.user = decoded;
    } catch (e) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const userRole = request.user?.role;

    if (!requiredRoles.includes(userRole)) {
      throw new ForbiddenException('Access denied');
    }

    return true;
  }
}
