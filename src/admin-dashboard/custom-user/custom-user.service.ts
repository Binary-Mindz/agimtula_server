import { Injectable } from '@nestjs/common';
import { CreateCustomUserDto } from './dto/create-custom-user.dto';
import { UpdateCustomUserDto } from './dto/update-custom-user.dto';
import { PrismaService } from 'src/config/database/prisma.service';
import { cResponseData } from 'src/common/cResponse';
import { UserRole } from '../../../prisma/generated/prisma/enums';
import * as bcrypt from 'bcrypt';

@Injectable()
export class CustomUserService {
  constructor(private prisma: PrismaService) {}
  async create(createCustomUserDto: CreateCustomUserDto) {
    try {
      const isUser = await this.prisma.customUser.findUnique({
        where: { email: createCustomUserDto.email },
      });

      if (isUser) {
        throw new Error('User with this email already exists');
      }
      const password = process.env.DEFAULT_PASSWORD;
      if (!password) {
        throw new Error('Default password not set in env');
      }
      const hashedPass = await bcrypt.hash(password, 10);
      const user = await this.prisma.customUser.create({
        data: {
          ...createCustomUserDto,
          password: hashedPass,
          userRole: 'CustomUser',
        },
      });

      return cResponseData({
        data: user,
        message: 'User created successfully',
      });
    } catch (error) {
      return cResponseData({ message: error.message as string });
    }
  }

  async findAll(search: string, status: string, plan: string) {
    try {
      const query = {
        NOT: {
          userRole: UserRole.ADMIN,
        },
      };

      if (search) {
        query['fullName'] = { contains: search, mode: 'insensitive' };
      }

      if (status) {
        query['status'] = status;
      }
      if (plan) {
        query['plan'] = { planName: plan };
      }

      const user = await this.prisma.customUser.findMany({
        where: query,
      });

      return cResponseData({
        data: user,
        message: 'Users retrieved successfully',
      });
    } catch (error) {
      return cResponseData({ message: error.message as string });
    }
  }

  async update(userId: string, updateCustomUserDto: UpdateCustomUserDto) {
    try {
      const user = await this.prisma.customUser.update({
        where: { id: userId },
        data: updateCustomUserDto,
      });

      return cResponseData({
        data: user,
        message: 'User updated successfully',
      });
    } catch (error) {
      return cResponseData({ message: error.message as string });
    }
  }

  async remove(id: string) {
    try {
      const user = await this.prisma.customUser.delete({
        where: { id: id },
      });
      return cResponseData({
        data: user,
        message: 'User deleted successfully',
      });
    } catch (error) {
      return cResponseData({ message: error.message as string });
    }
  }
}
