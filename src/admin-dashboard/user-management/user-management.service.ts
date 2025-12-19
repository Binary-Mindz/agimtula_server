import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/config/database/prisma.service';

@Injectable()
export class UserManagementService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllUsers() {
    const users = await this.prisma.user.findMany({
      include: { userSubscriptionPlan: true },
    });

    console.log(users);

    return `This action returns all userManagement`;
  }
}
