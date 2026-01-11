import { Module } from '@nestjs/common';
import { PurchaseManagementService } from './purchase-management.service';
import { PurchaseManagementController } from './purchase-management.controller';
import { ValidateAccountantAccess } from '../validate-accountant-access';

@Module({
  controllers: [PurchaseManagementController],
  providers: [PurchaseManagementService, ValidateAccountantAccess],
})
export class PurchaseManagementModule {}
