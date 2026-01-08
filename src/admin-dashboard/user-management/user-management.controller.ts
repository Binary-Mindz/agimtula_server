import { Controller, Get } from '@nestjs/common';
import { UserManagementService } from './user-management.service';
import { Public } from 'src/auth/decorators/public.decorator';
import { urlPrefix } from '../url-prefix';
import { ApiOperation } from '@nestjs/swagger';

@Controller(`${urlPrefix}/user-management`)
export class AdminUserManagementController {
  constructor(private readonly userManagementService: UserManagementService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all users ( PUBLIC )' })
  findAll() {
    return this.userManagementService.findAllUsers();
  }
}
