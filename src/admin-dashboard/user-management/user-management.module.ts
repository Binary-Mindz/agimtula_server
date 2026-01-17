import { Module } from '@nestjs/common';
import { UserManagementService } from './user-management.service';
import { AdminUserManagementController } from './user-management.controller';
import { SmtpMailModule } from 'src/config/smtp-mail/smtp-mail.module';
import { ActivityLogModule } from 'src/common/activity-log/activity-log.module';

@Module({
  imports: [SmtpMailModule, ActivityLogModule],
  controllers: [AdminUserManagementController],
  providers: [UserManagementService],
})
export class UserManagementModule {}
