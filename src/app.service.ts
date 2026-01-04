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

  createUser() {
    return '';
  }
}
