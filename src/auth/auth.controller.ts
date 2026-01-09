import {
  Controller,
  Post,
  Body,
  HttpCode,
  Patch,
  Get,
  Delete,
  Param,
  BadRequestException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SendRegistrationOtpDto } from './dto/send-registration-otp.dto';
import { VerifyRegistrationOtpDto } from './dto/verify-registration-otp.dto';
import { CompleteRegistrationDto } from './dto/complete-registration.dto';
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
import { ApiBody, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import {
  UpdateProfileDto,
  UpdateProfilePicDto,
} from './dto/update-profile.dto';
import { EnableTwoFADto, VerifyTwoFADto } from './dto/two-fa.dto';
import { UploadImageDto } from './dto/upload-image.dto';
import { TwoFAService } from './2fa.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly forgetPasswordService: ForgetPasswordService,
    private readonly twoFAService: TwoFAService,
  ) { }

  @HttpCode(200)
  @ApiOperation({ summary: 'Send registration OTP ( PUBLIC )' })
  @ApiResponse({ status: 200, description: 'OTP sent successfully' })
  @ApiResponse({
    status: 400,
    description: 'Validation failed or email exists',
  })
  @Public()
  @Post('registration/send-otp')
  async sendRegistrationOtp(@Body(new ValidationPipe()) dto: SendRegistrationOtpDto) {
    return await this.authService.sendRegistrationOtp(dto);
  }

  @HttpCode(200)
  @ApiOperation({ summary: 'Verify registration OTP ( PUBLIC )' })
  @ApiResponse({ status: 200, description: 'OTP verified successfully' })
  @ApiResponse({
    status: 400,
    description: 'Invalid or expired OTP',
  })
  @Public()
  @Post('registration/verify-otp')
  async verifyRegistrationOtp(@Body(new ValidationPipe()) dto: VerifyRegistrationOtpDto) {
    return await this.authService.verifyRegistrationOtp(dto);
  }

  @HttpCode(201)
  @ApiOperation({ summary: 'Complete user registration ( PUBLIC )' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({
    status: 400,
    description: 'Invalid verification token or user exists',
  })

  @Public()
  @Post('registration/complete')
  async completeRegistration(@Body(new ValidationPipe()) dto: CompleteRegistrationDto) {
    return await this.authService.completeRegistration(dto);
  }

  @HttpCode(200)
  @ApiOperation({ summary: 'User login ( PUBLIC )' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @Post('login')
  @Public()
  async login(@Body() loginDto: LoginDto) {
    return await this.authService.login(loginDto);
  }

  @HttpCode(200)
  @ApiOperation({ summary: 'Verify login 2FA ( PUBLIC )' })
  @ApiResponse({ status: 200, description: '2FA verification successful' })
  @ApiResponse({ status: 400, description: 'Invalid 2FA code' })
  @Post('verifyLogin')
  @Public()
  async verifyLogin(@Body() verify: VerifyTwoFADto) {
    return await this.authService.verifyLogin2FA(verify);
  }

  @HttpCode(200)
  @ApiOperation({ summary: 'Update password ( USER, ADMIN, ACCOUNTANT )' })
  @ApiResponse({ status: 200, description: 'Password updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid old password' })
  @Patch('update-password')
  @Roles('USER', 'ADMIN', 'ACCOUNTANT')
  async updatePassword(
    @Body() data: UpdatePasswordDto,
    @User() user: jwtPayload,
  ) {
    return await this.authService.updatePassword(
      user.sub,
      data.oldPassword,
      data.newPassword,
    );
  }

  @HttpCode(204)
  @ApiOperation({ summary: 'Delete account ( USER, ADMIN, ACCOUNTANT )' })
  @ApiResponse({ status: 204, description: 'Account deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Delete('delete-account')
  @Roles('USER', 'ADMIN', 'ACCOUNTANT')
  async deleteAccount(@User() user: jwtPayload) {
    return await this.authService.deleteAccount(user.sub);
  }

  @ApiOperation({
    summary: 'Update profile picture ( USER, ADMIN, ACCOUNTANT )',
  })
  @ApiResponse({
    status: 200,
    description: 'Profile picture updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid base64 image' })
  @Patch('update-profile-pic')
  @Roles('USER', 'ADMIN', 'ACCOUNTANT')
  @ApiBody({ type: UpdateProfilePicDto })
  async updateProfilePic(
    @User() user: jwtPayload,
    @Body() data: UpdateProfilePicDto,
  ) {
    if (!data.profilePic) {
      throw new BadRequestException('Profile picture is required');
    }
    return await this.authService.updateProfilepic(user.sub, data.profilePic);
  }

  @HttpCode(200)
  @ApiOperation({
    summary: 'Remove profile picture ( USER, ADMIN, ACCOUNTANT )',
  })
  @ApiResponse({
    status: 200,
    description: 'Profile picture removed successfully',
  })
  @ApiResponse({ status: 404, description: 'No profile picture found' })
  @Patch('remove-profile-pic')
  @Roles('USER', 'ADMIN', 'ACCOUNTANT')
  async removeProfilePic(@User() user: jwtPayload) {
    return await this.authService.removeProfilePic(user.sub);
  }

  @HttpCode(200)
  @ApiOperation({ summary: 'Update profile ( USER, ADMIN, ACCOUNTANT )' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @Patch('update-profile')
  @Roles('USER', 'ADMIN', 'ACCOUNTANT')
  async updateProfile(
    @Body() data: UpdateProfileDto,
    @User() user: jwtPayload,
  ) {
    return await this.authService.updateProfile(user.sub, data);
  }

  @HttpCode(200)
  @ApiOperation({ summary: 'Get profile ( USER, ADMIN, ACCOUNTANT )' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  @Get('profile')
  @Roles('USER', 'ADMIN', 'ACCOUNTANT')
  async getProfile(@User() user: jwtPayload) {
    return await this.authService.getProfile(user.sub);
  }
  // @Delete('delete')
  // @Roles('USER', 'ADMIN', 'ACCOUNTANT')
  // deleteAccount(@User() user: jwtPayload) {
  //   return this.authService.deleteAccount(user.sub);
  // }

  @HttpCode(200)
  @ApiOperation({ summary: 'Send forget password code ( PUBLIC )' })
  @ApiResponse({ status: 200, description: 'Forget password code sent' })
  @ApiResponse({ status: 404, description: 'Email not found' })
  @Post('send-forget-password-code')
  @Public()
  async forgetPassword(@Body() dto: ForgetPassDto) {
    return await this.forgetPasswordService.sendForgetPassCode(dto);
  }

  @HttpCode(200)
  @ApiOperation({ summary: 'Verify forget password code ( PUBLIC )' })
  @ApiResponse({ status: 200, description: 'Code verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired code' })
  @Post('verify-forget-password-code')
  @Public()
  async verifyForgetPassword(@Body() data: ValidateForgetPass) {
    return await this.forgetPasswordService.verifyForgetPassCode(data);
  }

  @HttpCode(200)
  @ApiOperation({ summary: 'Change password ( PUBLIC )' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  @Post('change-password/:crypto')
  @Public()
  @ApiParam({
    name: 'crypto',
    description: 'Crypto value sent to the user',
    example: 'a5d7fa9c87f385f0934fbed3b8cc7c81681360c7dbfe1925bdaa8d0a1d32bf14',
  })
  async changePassword(
    @Body() data: ResetPass,
    @Param('crypto') crypto: string,
  ) {
    return await this.forgetPasswordService.changePassword(data, crypto);
  }

  // 2fa features

  @HttpCode(200)
  @ApiOperation({ summary: 'Enable 2FA ( USER, ADMIN, ACCOUNTANT )' })
  @ApiResponse({ status: 200, description: '2FA code sent successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  @Post('2fa/enable')
  @Roles('USER', 'ADMIN', 'ACCOUNTANT')
  async enable2FA(@User() user: jwtPayload, @Body() dto: EnableTwoFADto) {
    return await this.twoFAService.sendTwoFACode(user.sub, dto);
  }

  @HttpCode(200)
  @ApiOperation({ summary: 'Verify 2FA ( USER, ADMIN, ACCOUNTANT )' })
  @ApiResponse({ status: 200, description: '2FA enabled successfully' })
  @ApiResponse({ status: 400, description: 'Invalid 2FA code' })
  @Post('2fa/verify')
  @Roles('USER', 'ADMIN', 'ACCOUNTANT')
  async verify2FA(@User() user: jwtPayload, @Body() dto: VerifyTwoFADto) {
    return await this.twoFAService.verifyAndEnableTwoFA(user.sub, dto);
  }

  @HttpCode(200)
  @ApiOperation({ summary: 'Disable 2FA ( USER, ADMIN, ACCOUNTANT )' })
  @ApiResponse({
    status: 200,
    description: '2FA disable code sent successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  @Post('2fa/disable')
  @Roles('USER', 'ADMIN', 'ACCOUNTANT')
  async disable2FA(@User() user: jwtPayload, @Body() dto: EnableTwoFADto) {
    return await this.twoFAService.sendDisableTwoFACode(user.sub, dto);
  }

  @HttpCode(200)
  @ApiOperation({ summary: 'Verify disable 2FA ( USER, ADMIN, ACCOUNTANT )' })
  @ApiResponse({ status: 200, description: '2FA disabled successfully' })
  @ApiResponse({ status: 400, description: 'Invalid 2FA code' })
  @Post('2fa/disable-verify')
  @Roles('USER', 'ADMIN', 'ACCOUNTANT')
  async verifyDisable2FA(
    @User() user: jwtPayload,
    @Body() dto: VerifyTwoFADto,
  ) {
    return await this.twoFAService.verifyAndDisableTwoFA(user.sub, dto);
  }

  @Post('upload-images')
  @Roles('USER', 'ADMIN', 'ACCOUNTANT')
  @ApiOperation({ summary: 'Upload images ( USER, ADMIN, ACCOUNTANT )' })
  @ApiBody({ type: UploadImageDto })
  @ApiResponse({ status: 200, description: 'Images processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid base64 images' })
  uploadImages(@Body() dto: UploadImageDto) {
    if (!dto.images || dto.images.length === 0) {
      throw new BadRequestException('No images provided');
    }

    // Validate base64 format
    const validImages = dto.images.filter(
      (img) => img.startsWith('data:image/') && img.includes('base64,'),
    );

    if (validImages.length === 0) {
      throw new BadRequestException('No valid base64 images found');
    }

    return {
      success: true,
      message: 'Images processed successfully',
      count: validImages.length,
      images: validImages,
    };
  }
}
