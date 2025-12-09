import { SetMetadata } from '@nestjs/common';
import { UserRole } from 'prisma/generated/prisma/enums';

export const role_str = 'roles';

export const Roles = (...roles: UserRole[]) => SetMetadata(role_str, roles);
