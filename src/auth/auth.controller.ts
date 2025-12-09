import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  ValidationPipe,
  HttpCode,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { LoginDto } from './dto/login.dto';
import {
  ForgetPassDto,
  ResetPass,
  ValidateForgetPass,
} from './dto/forget-pass-dto';
import { RolesGuard } from './guards/roles/roles.guard';
import { JwtAccessGuard } from './guards/jwt/jwt-access.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
// import { UpdateAuthDto } from './dto/update-auth.dto';

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

  @Get(':id')
  @Roles('ADMIN',"USER")
  @UseGuards(JwtAccessGuard, RolesGuard)
  getUserData(@Param('id', ParseIntPipe) id: number) {
    return this.authService.findOne(id);
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
