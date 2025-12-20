import { Controller, Get } from '@nestjs/common';
import { UserManagementService } from './user-management.service';
import { Public } from 'src/auth/decorators/public.decorator';

@Controller('user-management')
export class UserManagementController {
  constructor(private readonly userManagementService: UserManagementService) {}

  @Public()
  @Get()
  findAll() {
    return this.userManagementService.findAllUsers();
  }
}
