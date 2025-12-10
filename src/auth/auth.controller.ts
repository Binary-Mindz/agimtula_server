import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  ValidationPipe,
  HttpCode,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { LoginDto } from './dto/login.dto';
import {
  ForgetPassDto,
  ResetPass,
  ValidateForgetPass,
} from './dto/forget-pass-dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @HttpCode(201)
  @Post('registration')
  create(@Body(new ValidationPipe()) createAuthDto: CreateAuthDto) {
    return this.authService.create(createAuthDto);
  }

  @HttpCode(200)
  @Post('login')
  login(@Body(new ValidationPipe()) loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @HttpCode(200)
  @Post('forget-password')
  forgetPassword(@Body(new ValidationPipe()) dto: ForgetPassDto) {
    return this.authService.sendForgetPassCode(dto);
  }

  @HttpCode(200)
  @Post('verify-forget-password')
  verifyForgetPassword(@Body(new ValidationPipe()) data: ValidateForgetPass) {
    return this.authService.verifyForgetPassCode(data);
  }

  @HttpCode(200)
  @Post('change-forgotten-password')
  changePassword(@Body(new ValidationPipe()) data: ResetPass) {
    return this.authService.changePassword(data);
  }

  @Get()
  findAll() {
    return this.authService.findAll();
  }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateAuthDto: UpdateAuthDto) {
  //   return this.authService.update(+id, updateAuthDto);
  // }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.authService.remove(+id);
  }
}
