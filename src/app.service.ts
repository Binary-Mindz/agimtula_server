import { Injectable } from '@nestjs/common';
import { PrismaService } from './config/database/prisma.service';

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  getHello(): string {
    return 'Hello World!';
  }

  async getUsers() {
    const users = await this.prisma.user.findMany();
    return users;
  }

  async createUser() {
    const user = await this.prisma.user.create({
      data: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'securepassword',
      },
    });
    return user;
  }
}
