import { Module } from '@nestjs/common';
import { UserManagementService } from './user-management.service';
import { AdminUserManagementController } from './user-management.controller';

@Module({
  controllers: [AdminUserManagementController],
  providers: [UserManagementService],
})
export class UserManagementModule {}
