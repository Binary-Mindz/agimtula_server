import { Controller, Get, Param, Post } from '@nestjs/common';
import { AccountantSettingsService } from './accountant-settings.service';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { ManageClients } from './manage-clients.service';
import { User } from 'src/auth/decorators/user.decorator';
import { jwtPayload } from 'src/auth/types/jwt-payload';
import { ApiParam } from '@nestjs/swagger';

@Controller('accountant-settings')
export class AccountantSettingsController {
  constructor(
    private readonly accountantSettingsService: AccountantSettingsService,
    private readonly manageClients: ManageClients,
  ) {}

  @Get('manage-clients/client-without-accountant')
  @Roles('ACCOUNTANT')
  async getUsersWithoutAccountant() {
    return await this.manageClients.getUsersWithoutAccountant();
  }

  @Post('manage-clients/add-accountant/:userId')
  @Roles('ACCOUNTANT')
  @ApiParam({ name: 'userId', type: 'string' })
  async addClient(@User() acc: jwtPayload, @Param('userId') userId: string) {
    return await this.manageClients.addClient(userId, acc.sub);
  }

  @Get('manage-clients/my-clients')
  @Roles('ACCOUNTANT')
  async getClients(@User() acc: jwtPayload) {
    return await this.manageClients.usersWithMe(acc.sub);
  }

  @Post('manage-clients/remove-client/:userId')
  @Roles('ACCOUNTANT')
  @ApiParam({ name: 'userId', type: 'string' })
  async removeFromMe(@User() acc: jwtPayload, @Param('userId') userId: string) {
    return await this.manageClients.removeFromMe(userId, acc.sub);
  }
}
