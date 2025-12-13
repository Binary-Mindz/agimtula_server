import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { SmtpMailModule } from 'src/config/smtp-mail/smtp-mail.module';
import { JwtStrategy } from './strategies/jwt-strategy';
import { ForgetPasswordService } from './forget-password.service';

@Module({
  imports: [
    SmtpMailModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET as string,
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, ForgetPasswordService],
})
export class AuthModule {}
