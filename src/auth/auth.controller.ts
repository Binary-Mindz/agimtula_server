import {
  Controller,
  Post,
  Body,
  ValidationPipe,
  HttpCode,
  Patch,
  // Delete,
  UsePipes,
  UseInterceptors,
  UploadedFile,
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
import { User } from './decorators/user.decorator';
import { jwtPayload } from './types/jwt-payload';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { Roles } from './decorators/roles.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes } from '@nestjs/swagger';
import { UpdateProfileDto } from './dto/update-profile.dto';

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
  @UsePipes(new ValidationPipe())
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Patch('update-password')
  @Roles('USER', 'ADMIN', 'ACCOUNTANT')
  @UsePipes(new ValidationPipe())
  updatePassword(@Body() data: UpdatePasswordDto, @User() user: jwtPayload) {
    return this.authService.updatePassword(
      user.sub,
      data.oldPassword,
      data.newPassword,
    );
  }

  @Patch('update-profile-pic')
  @Roles('USER', 'ADMIN', 'ACCOUNTANT')
  @UsePipes(new ValidationPipe())
  @UseInterceptors(FileInterceptor('profilePic'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UpdateProfileDto })
  updateProfilePic(
    @UploadedFile() profilePic: Express.Multer.File,
    @User() user: jwtPayload,
  ) {
    return this.authService.updateProfilepic(profilePic, user.sub);
  }

  @Patch('remove-profile-pic')
  @Roles('USER', 'ADMIN', 'ACCOUNTANT')
  removeProfilePic(@User() user: jwtPayload) {
    return this.authService.removeProfilePic(user.sub);
  }

  // @Delete('delete')
  // @Roles('USER', 'ADMIN', 'ACCOUNTANT')
  // deleteAccount(@User() user: jwtPayload) {
  //   return this.authService.deleteAccount(user.sub);
  // }

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
