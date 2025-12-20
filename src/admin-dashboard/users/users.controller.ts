import {
  Body,
  Controller,
  Get,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { User } from 'src/auth/decorators/user.decorator';
import { jwtPayload } from 'src/auth/types/jwt-payload';

@Controller('admin/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}
  @Post('create-user-dto')
  @Roles('ADMIN')
  @UsePipes(new ValidationPipe({ transform: true }))
  createUserDto(@Body() dto: CreateUserDto) {
    return { dto };
  }

  @Get('get-users')
  @Roles('ADMIN')
  getUsers(@User() user: jwtPayload) {
    return this.usersService.getUsers(user);
  }
}
