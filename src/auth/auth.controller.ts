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
import { ApiBody, ApiConsumes, ApiParam, ApiResponse } from '@nestjs/swagger';
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
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed or email exists' })
  @Public()
  @Post('registration')
  create(@Body(new ValidationPipe()) createAuthDto: CreateAuthDto) {
    return this.authService.create(createAuthDto);
  }

  @HttpCode(200)
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @Post('login')
  @Public()
  @UsePipes(new ValidationPipe())
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }
  
  @HttpCode(200)
  @ApiResponse({ status: 200, description: '2FA verification successful' })
  @ApiResponse({ status: 400, description: 'Invalid 2FA code' })
  @Post('verifyLogin')
  @Public()
  @UsePipes(new ValidationPipe())
  verifyLogin(@Body() verify: VerifyTwoFADto) {
    return this.authService.verifyLogin2FA(verify);
  }

  @HttpCode(200)
  @ApiResponse({ status: 200, description: 'Password updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid old password' })
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

  @HttpCode(204)
  @ApiResponse({ status: 204, description: 'Account deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Delete('delete-account')
  @Roles('USER', 'ADMIN', 'ACCOUNTANT')
  deleteAccount(@User() user: jwtPayload) {
    return this.authService.deleteAccount(user.sub);
  }

  @HttpCode(200)
  @ApiResponse({ status: 200, description: 'Profile picture updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file format or too large' })
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

  @HttpCode(200)
  @ApiResponse({ status: 200, description: 'Profile picture removed successfully' })
  @ApiResponse({ status: 404, description: 'No profile picture found' })
  @Patch('remove-profile-pic')
  @Roles('USER', 'ADMIN', 'ACCOUNTANT')
  removeProfilePic(@User() user: jwtPayload) {
    return this.authService.removeProfilePic(user.sub);
  }

  @HttpCode(200)
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @Patch('update-profile')
  @Roles('USER', 'ADMIN', 'ACCOUNTANT')
  @UsePipes(new ValidationPipe())
  updateProfile(@Body() data: UpdateProfileDto, @User() user: jwtPayload) {
    return this.authService.updateProfile(user.sub, data);
  }

  @HttpCode(200)
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Profile not found' })
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
  @ApiResponse({ status: 200, description: 'Forget password code sent' })
  @ApiResponse({ status: 404, description: 'Email not found' })
  @Post('send-forget-password-code')
  @Public()
  forgetPassword(@Body(new ValidationPipe()) dto: ForgetPassDto) {
    return this.forgetPasswordService.sendForgetPassCode(dto);
  }

  @HttpCode(200)
  @ApiResponse({ status: 200, description: 'Code verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired code' })
  @Post('verify-forget-password-code')
  @Public()
  verifyForgetPassword(@Body(new ValidationPipe()) data: ValidateForgetPass) {
    return this.forgetPasswordService.verifyForgetPassCode(data);
  }

  @HttpCode(200)
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
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

  @HttpCode(200)
  @ApiResponse({ status: 200, description: '2FA code sent successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  @Post('2fa/enable')
  @Roles('USER', 'ADMIN', 'ACCOUNTANT')
  enable2FA(@User() user: jwtPayload, @Body() dto: EnableTwoFADto) {
    return this.twoFAService.sendTwoFACode(user.sub, dto);
  }

  @HttpCode(200)
  @ApiResponse({ status: 200, description: '2FA enabled successfully' })
  @ApiResponse({ status: 400, description: 'Invalid 2FA code' })
  @Post('2fa/verify')
  @Roles('USER', 'ADMIN', 'ACCOUNTANT')
  verify2FA(@User() user: jwtPayload, @Body() dto: VerifyTwoFADto) {
    return this.twoFAService.verifyAndEnableTwoFA(user.sub, dto);
  }

  @HttpCode(200)
  @ApiResponse({ status: 200, description: '2FA disable code sent successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  @Post('2fa/disable')
  @Roles('USER', 'ADMIN', 'ACCOUNTANT')
  disable2FA(@User() user: jwtPayload, @Body() dto: EnableTwoFADto) {
    return this.twoFAService.sendDisableTwoFACode(user.sub, dto);
  }

  @HttpCode(200)
  @ApiResponse({ status: 200, description: '2FA disabled successfully' })
  @ApiResponse({ status: 400, description: 'Invalid 2FA code' })
  @Post('2fa/disable-verify')
  @Roles('USER', 'ADMIN', 'ACCOUNTANT')
  verifyDisable2FA(@User() user: jwtPayload, @Body() dto: VerifyTwoFADto) {
    return this.twoFAService.verifyAndDisableTwoFA(user.sub, dto);
  }
}
