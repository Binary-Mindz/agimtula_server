import { Controller, Get, Param } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { ApiParam } from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { User } from 'src/auth/decorators/user.decorator';
import { jwtPayload } from 'src/auth/types/jwt-payload';

@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get(':userId')
  @ApiParam({ name: 'userId', description: 'User ID', required: true })
  @Roles('ACCOUNTANT')
  async getClients(@User() user: jwtPayload, @Param('userId') userId: string) {
    return await this.clientsService.clients(userId, user.sub);
  }
}
