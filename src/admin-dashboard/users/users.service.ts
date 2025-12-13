import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/config/database/prisma.service';
// import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  //   async createUser(dto: CreateUserDto) {}
}
