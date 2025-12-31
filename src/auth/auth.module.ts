import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { SmtpMailModule } from 'src/config/smtp-mail/smtp-mail.module';
import { JwtStrategy } from './strategies/jwt-strategy';
import { ForgetPasswordService } from './forget-password.service';
import { TwoFAService } from './2fa.service';
import { RedisServiceModule } from 'src/config/redis-service/redis-service.module';
import { PermissionService } from './permission-management/permission.service';
import { AuthGuard } from './guard/auth.guard';
import { ModuleAccessGuard } from './guard/module-access.guard';
import { PermissionManagementController } from './permission-management/permission-management.controller';

@Module({
  imports: [
    SmtpMailModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET as string,
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [AuthController, PermissionManagementController],
  providers: [
    AuthService,
    JwtStrategy,
    ForgetPasswordService,
    TwoFAService,
    RedisServiceModule,
    PermissionService,
    ModuleAccessGuard,
    AuthGuard
  ],
  exports: [PermissionService, ModuleAccessGuard, AuthGuard],
})
export class AuthModule { }
