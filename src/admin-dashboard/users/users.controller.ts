import {
  Body,
  Controller,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}
  @Post('create-user-dto')
  @Roles('ADMIN')
  @UsePipes(new ValidationPipe({ transform: true }))
  async createUserDto(@Body() dto: CreateUserDto) {
    return { dto };
  }
}
