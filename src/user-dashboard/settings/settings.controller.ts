import {
  Body,
  Controller,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { SettingsService } from './settings.service';
import { BusinessInfoDto } from './dto/business-info.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes } from '@nestjs/swagger';
import { PaymentMethodDto } from './dto/payment-method.dto';
import { InvoiceLayoutDto } from './dto/invoice-layout.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Patch('update-business-info')
  @Roles('USER')
  @UsePipes(new ValidationPipe({ transform: true }))
  @UseInterceptors(FileInterceptor('logo'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: BusinessInfoDto })
  async updateBusinessInfo(
    @Body() dto: BusinessInfoDto,
    @UploadedFile() logo: Express.Multer.File,
  ) {
    return await this.settingsService.updateBusinessInfo(dto, logo);
  }

  @Patch('update-payment-method')
  @Roles('USER')
  @UsePipes(new ValidationPipe({ transform: true }))
  async updatePaymentInfo(@Body() dto: PaymentMethodDto) {
    return await this.settingsService.paymentMethod(dto);
  }
  @Post('invoice-layout')
  @Roles('USER')
  @UsePipes(new ValidationPipe({ transform: true }))
  async invoiceLayout(@Body() dto: InvoiceLayoutDto) {
    return await this.settingsService.invoiceLayout(dto);
  }
}
