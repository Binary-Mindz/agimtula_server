import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/config/database/prisma.service';

@Injectable()
export class ValidateAccountantAccess {
  constructor(private readonly prisma: PrismaService) {}
  async validate(userId: string, accId: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        role: 'USER',
        haveAccountant: true,
        accountantId: accId,
      },
    });

    if (!user) {
      throw new ForbiddenException(
        'You are not authorized to access this resource',
      );
    }
  }
}
