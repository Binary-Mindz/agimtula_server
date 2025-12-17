import { Injectable, NotFoundException } from '@nestjs/common';
import { JwtPayload } from 'jsonwebtoken';
import { cResponseData } from 'src/common/cResponse';
import { PrismaService } from 'src/config/database/prisma.service';
// import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getUsers(user: JwtPayload) {
    const users = await this.prisma.user.findMany({
      where: {
        NOT: { id: user.sub },
      },
      select: {
        role: true,
        created_at: true,
        status: true,
        // plan:true
        profile: {
          select: { firstName: true, lastName: true, profilePicture: true },
        },
        email: {
          select: { email: true },
        },
      },
    });

    if (users.length === 0) {
      throw new NotFoundException('User not found');
    }
    return cResponseData({
      data: {
        users: users.map((user) => ({
          role: user.role,
          email: user.email?.email,
          name: `${user.profile?.firstName} ${user.profile?.lastName}`,
          profilePicture: user.profile?.profilePicture,
          status: user.status,
          // plan: user.plan,
          joined: user.created_at,
        })),
        total: users.length,
      },
      message: 'Users fetched successfully',
    });
  }

  //   async createUser(dto: CreateUserDto) {}
}
