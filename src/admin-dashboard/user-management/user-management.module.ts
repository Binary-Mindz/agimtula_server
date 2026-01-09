import { Module } from '@nestjs/common';
import { UserManagementService } from './user-management.service';
import { AdminUserManagementController } from './user-management.controller';
import { SmtpMailModule } from 'src/config/smtp-mail/smtp-mail.module';

@Module({
  imports: [SmtpMailModule],
  controllers: [AdminUserManagementController],
  providers: [UserManagementService],
})
export class UserManagementModule {}
