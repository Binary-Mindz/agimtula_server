import {
  Body,
  Controller,
  HttpCode,
  Post,
  ValidationPipe,
} from '@nestjs/common';
import { ForgetPasswordService } from './forget-password.service';
import { Public } from 'src/auth/decorators/public.decorator';
import {
  ForgetPassDto,
  ResetPass,
  ValidateForgetPass,
} from './dto/forget-pass-dto';

@Controller('forget-password')
export class ForgetPasswordController {
  constructor(private readonly forgetPasswordService: ForgetPasswordService) {}

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
