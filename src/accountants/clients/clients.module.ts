import { Module } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { ClientsController } from './clients.controller';
import { ValidateAccountantAccess } from '../validate-accountant-access';

@Module({
  controllers: [ClientsController],
  providers: [ClientsService, ValidateAccountantAccess],
})
export class ClientsModule {}
