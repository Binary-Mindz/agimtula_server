import { Controller, Get } from '@nestjs/common';
import { UserManagementService } from './user-management.service';
import { Public } from 'src/auth/decorators/public.decorator';
import { urlPrefix } from '../url-prefix';

@Controller(`${urlPrefix}/user-management`)
export class AdminUserManagementController {
  constructor(private readonly userManagementService: UserManagementService) {}

  @Public()
  @Get()
  findAll() {
    return this.userManagementService.findAllUsers();
  }
}
