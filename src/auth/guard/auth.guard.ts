import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as jwt from 'jsonwebtoken';
import { IS_PUBLIC_KEY } from 'src/decorators/public.decorator';
import { ROLE_KEY } from 'src/decorators/roles.decorator';
import { jwtPayload } from 'src/auth/types/jwt-payload';
import { PrismaService } from 'src/config/database/prisma.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
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

    const token: string = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as jwtPayload;

      const user = await this.prisma.user.findUnique({
        where: { id: decoded.sub, isDeleted: false },
      });

      if (!user) {
        throw new UnauthorizedException('User not found or deleted');
      }

      request.user = decoded;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const userRole: string = request.user?.role;

    if (!requiredRoles.includes(userRole)) {
      throw new ForbiddenException('Insufficient permissions to access this resource ');
    }

    return true;
  }
}
