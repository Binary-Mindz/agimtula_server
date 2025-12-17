import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { SettingsService } from './settings.service';
import { BusinessInfoDto, UpdateLogoDto } from './dto/business-info.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes } from '@nestjs/swagger';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { InvoiceLayoutDto } from './dto/invoice-layout.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { User } from 'src/auth/decorators/user.decorator';
import { jwtPayload } from 'src/auth/types/jwt-payload';
import { UpdatePaymentMethodDto } from './dto/update-payment-method.dto';
import { PaymentMethodService } from './paymentMethod.service';
import { InvoiceLayoutService } from './invoice-layout.service';
import { NotificationsService } from './notifications.service';
import { UpdateNotificationSettingsDto } from './dto/update-notification-settings.dto';

@Controller('settings')
export class SettingsController {
  constructor(
    private readonly settingsService: SettingsService,
    private readonly paymentMethodService: PaymentMethodService,
    private readonly invoiceLayoutService: InvoiceLayoutService,
    private readonly notificationService: NotificationsService,
  ) {}

  // business infos
  @Get('business-info')
  @Roles('USER', 'ADMIN')
  getBusinessInfo(@User() user: jwtPayload) {
    return this.settingsService.getBusinessInfo(user.sub);
  }

  @Patch('update-business-info')
  @Roles('USER', 'ADMIN')
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateBusinessInfo(
    @Body() dto: BusinessInfoDto,
    @User() user: jwtPayload,
  ) {
    const userId: string = user.sub;
    return await this.settingsService.updateBusinessInfo(userId, dto);
  }

  @Patch('update-business-logo')
  @Roles('USER', 'ADMIN')
  @UseInterceptors(FileInterceptor('logo'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UpdateLogoDto })
  updateBusinessLogo(
    @User() user: jwtPayload,
    @UploadedFile() logo: Express.Multer.File,
  ) {
    return this.settingsService.updateBusinessLogo(user.sub, logo);
  }

  @Patch('remove-business-logo')
  @Roles('USER', 'ADMIN')
  removeBusinessLogo(@User() user: jwtPayload) {
    return this.settingsService.removeBusinessLogo(user.sub);
  }

  // payment method
  @Post('create-payment-method')
  @Roles('USER', 'ADMIN')
  @UsePipes(new ValidationPipe({ transform: true }))
  createPaymentMethod(
    @Body() dto: CreatePaymentMethodDto,
    @User() user: jwtPayload,
    makeDefault: boolean,
  ) {
    return this.paymentMethodService.createPaymentMethod(
      user.sub,
      dto,
      makeDefault,
    );
  }

  @Patch('update-payment-method/:id')
  @Roles('USER', 'ADMIN')
  @UsePipes(new ValidationPipe({ transform: true }))
  updatePaymentMethod(
    @Param('id') id: string,
    @Body() dto: UpdatePaymentMethodDto,
  ) {
    return this.paymentMethodService.updatePaymentMethod(id, dto);
  }

  @Get('payment-methods')
  @Roles('USER', 'ADMIN')
  getPaymentMethods(@User() user: jwtPayload) {
    return this.paymentMethodService.getPaymentMethods(user.sub);
  }

  @Patch('make-payment-default/:id')
  @Roles('USER', 'ADMIN')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        makeDefault: {
          type: 'boolean',
          default: true,
        },
      },
    },
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  makePaymentDefault(
    @Param('id') id: string,
    @User() user: jwtPayload,
    @Body()
    makeDefault?: {
      makeDefault: boolean;
    },
  ) {
    return this.paymentMethodService.makePaymentDefault(
      user.sub,
      id,
      makeDefault?.makeDefault,
    );
  }

  //invoice layout
  @Get('invoice-layout')
  @Roles('USER', 'ADMIN')
  getInvoiceLayout(@User() user: jwtPayload) {
    return this.invoiceLayoutService.findByUser(user.sub);
  }

  @Patch('update-invoice-layout')
  @Roles('USER', 'ADMIN')
  @UsePipes(new ValidationPipe({ transform: true }))
  invoiceLayout(@Body() dto: InvoiceLayoutDto, @User() user: jwtPayload) {
    return this.invoiceLayoutService.updateLayout(user.sub, dto);
  }

  // notification settings
  @Get('notification-settings')
  @Roles('USER', 'ADMIN')
  getNotificationSettings(@User() user: jwtPayload) {
    return this.notificationService.getPreferences(user.sub);
  }

  @Patch('update-notification-settings')
  @Roles('USER', 'ADMIN')
  @UsePipes(new ValidationPipe({ transform: true }))
  updateNotificationSettings(
    @User() user: jwtPayload,
    @Body() dto: UpdateNotificationSettingsDto,
  ) {
    return this.notificationService.updatePreferences(user, dto);
  }
}
