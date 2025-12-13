import {
  Controller,
  Post,
  Body,
  ValidationPipe,
  HttpCode,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { LoginDto } from './dto/login.dto';

import { Public } from './decorators/public.decorator';
import {
  ForgetPassDto,
  ResetPass,
  ValidateForgetPass,
} from './dto/forget-pass-dto';
import { ForgetPasswordService } from './forget-password.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly forgetPasswordService: ForgetPasswordService,
  ) {}

  @HttpCode(201)
  @Public()
  @Post('registration')
  create(@Body(new ValidationPipe()) createAuthDto: CreateAuthDto) {
    return this.authService.create(createAuthDto);
  }

  @HttpCode(200)
  @Post('login')
  @Public()
  login(@Body(new ValidationPipe()) loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @HttpCode(200)
  @Post('forget-password')
  @Public()
  forgetPassword(@Body(new ValidationPipe()) dto: ForgetPassDto) {
    return this.forgetPasswordService.sendForgetPassCode(dto);
  }

  @HttpCode(200)
  @Post('verify-forget-password')
  @Public()
  verifyForgetPassword(@Body(new ValidationPipe()) data: ValidateForgetPass) {
    return this.forgetPasswordService.verifyForgetPassCode(data);
  }

  @HttpCode(200)
  @Post('change-forgotten-password')
  @Public()
  changePassword(@Body(new ValidationPipe()) data: ResetPass) {
    return this.forgetPasswordService.changePassword(data);
  }
}
