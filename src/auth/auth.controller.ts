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
  Get,
  Delete,
  Param,
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
import { ApiBody, ApiConsumes, ApiParam } from '@nestjs/swagger';
import {
  UpdateProfileDto,
  UpdateProfilePicDto,
} from './dto/update-profile.dto';
import { EnableTwoFADto, VerifyTwoFADto } from './dto/two-fa.dto';
import { TwoFAService } from './2fa.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly forgetPasswordService: ForgetPasswordService,
    private readonly twoFAService: TwoFAService,
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
  @HttpCode(200)
  @Post('verifyLogin')
  @Public()
  @UsePipes(new ValidationPipe())
  verifyLogin(@Body() verify: VerifyTwoFADto) {
    return this.authService.verifyLogin2FA(verify);
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

  @Delete('delete-account')
  @Roles('USER', 'ADMIN', 'ACCOUNTANT')
  deleteAccount(@User() user: jwtPayload) {
    return this.authService.deleteAccount(user.sub);
  }

  @Patch('update-profile-pic')
  @Roles('USER', 'ADMIN', 'ACCOUNTANT')
  @UsePipes(new ValidationPipe())
  @UseInterceptors(FileInterceptor('profilePic'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UpdateProfilePicDto })
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

  @Patch('update-profile')
  @Roles('USER', 'ADMIN', 'ACCOUNTANT')
  @UsePipes(new ValidationPipe())
  updateProfile(@Body() data: UpdateProfileDto, @User() user: jwtPayload) {
    return this.authService.updateProfile(user.sub, data);
  }

  @Get('profile')
  @Roles('USER', 'ADMIN', 'ACCOUNTANT')
  getProfile(@User() user: jwtPayload) {
    return this.authService.getProfile(user.sub);
  }
  // @Delete('delete')
  // @Roles('USER', 'ADMIN', 'ACCOUNTANT')
  // deleteAccount(@User() user: jwtPayload) {
  //   return this.authService.deleteAccount(user.sub);
  // }

  @HttpCode(200)
  @Post('send-forget-password-code')
  @Public()
  forgetPassword(@Body(new ValidationPipe()) dto: ForgetPassDto) {
    return this.forgetPasswordService.sendForgetPassCode(dto);
  }

  @HttpCode(200)
  @Post('verify-forget-password-code')
  @Public()
  verifyForgetPassword(@Body(new ValidationPipe()) data: ValidateForgetPass) {
    return this.forgetPasswordService.verifyForgetPassCode(data);
  }

  @HttpCode(200)
  @Post('change-password/:crypto')
  @Public()
  @ApiParam({
    name: 'crypto',
    description: 'Crypto value sent to the user',
    example: 'a5d7fa9c87f385f0934fbed3b8cc7c81681360c7dbfe1925bdaa8d0a1d32bf14',
  })
  changePassword(
    @Body(new ValidationPipe()) data: ResetPass,
    @Param('crypto') crypto: string,
  ) {
    return this.forgetPasswordService.changePassword(data, crypto);
  }

  // 2fa features

  @Post('2fa/enable')
  @Roles('USER', 'ADMIN', 'ACCOUNTANT')
  enable2FA(@User() user: jwtPayload, @Body() dto: EnableTwoFADto) {
    return this.twoFAService.sendTwoFACode(user.sub, dto);
  }

  @Post('2fa/verify')
  @Roles('USER', 'ADMIN', 'ACCOUNTANT')
  verify2FA(@User() user: jwtPayload, @Body() dto: VerifyTwoFADto) {
    return this.twoFAService.verifyAndEnableTwoFA(user.sub, dto);
  }

  @Post('2fa/disable')
  @Roles('USER', 'ADMIN', 'ACCOUNTANT')
  disable2FA(@User() user: jwtPayload, @Body() dto: EnableTwoFADto) {
    return this.twoFAService.sendDisableTwoFACode(user.sub, dto);
  }

  @Post('2fa/disable-verify')
  @Roles('USER', 'ADMIN', 'ACCOUNTANT')
  verifyDisable2FA(@User() user: jwtPayload, @Body() dto: VerifyTwoFADto) {
    return this.twoFAService.verifyAndDisableTwoFA(user.sub, dto);
  }
}
