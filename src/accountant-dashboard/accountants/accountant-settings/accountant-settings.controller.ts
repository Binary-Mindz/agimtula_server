import { Controller, Get, Param, Post } from '@nestjs/common';
import { AccountantSettingsService } from './accountant-settings.service';
import { Roles } from 'src/decorators/roles.decorator';
import { ManageClients } from './manage-clients.service';
import { User } from 'src/decorators/user.decorator';
import { jwtPayload } from 'src/auth/types/jwt-payload';
import { ApiOperation, ApiParam } from '@nestjs/swagger';

@Controller('accountant-settings')
export class AccountantSettingsController {
  constructor(
    private readonly accountantSettingsService: AccountantSettingsService,
    private readonly manageClients: ManageClients,
  ) { }

  @Get('manage-clients/client-without-accountant')
  @Roles('ACCOUNTANT')
  @ApiOperation({ summary: 'Get users without accountant ( ACCOUNTANT only )' })
  async getUsersWithoutAccountant() {
    return await this.manageClients.getUsersWithoutAccountant();
  }

  @Post('manage-clients/add-accountant/:userId')
  @Roles('ACCOUNTANT')
  @ApiOperation({ summary: 'Add client ( ACCOUNTANT only )' })
  @ApiParam({ name: 'userId', type: 'string' })
  async addClient(@User() acc: jwtPayload, @Param('userId') userId: string) {
    return await this.manageClients.addClient(userId, acc.sub);
  }

  @Get('manage-clients/my-clients')
  @Roles('ACCOUNTANT')
  @ApiOperation({ summary: 'Get my clients ( ACCOUNTANT only )' })
  async getClients(@User() acc: jwtPayload) {
    return await this.manageClients.usersWithMe(acc.sub);
  }

  @Post('manage-clients/remove-client/:userId')
  @Roles('ACCOUNTANT')
  @ApiOperation({ summary: 'Remove client ( ACCOUNTANT only )' })
  @ApiParam({ name: 'userId', type: 'string' })
  async removeFromMe(@User() acc: jwtPayload, @Param('userId') userId: string) {
    return await this.manageClients.removeFromMe(userId, acc.sub);
  }
}
