import { Controller, Get } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { Roles } from 'src/decorators/roles.decorator';
import { User } from 'src/decorators/user.decorator';
import { jwtPayload } from 'src/auth/types/jwt-payload';

@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) { }

  @Get('')
  @Roles('ACCOUNTANT')
  async getClients(@User() user: jwtPayload) {
    return await this.clientsService.clients(user.sub);
  }
}
