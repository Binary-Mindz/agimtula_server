import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { SettingsService } from './settings.service';
import { BusinessInfoDto, UpdateLogoDto } from './dto/business-info.dto';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
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
import { urlPrefix } from '../url-prefix';

@Controller(`${urlPrefix}/settings`)
export class UserSettingsController {
  constructor(
    private readonly settingsService: SettingsService,
    private readonly paymentMethodService: PaymentMethodService,
    private readonly invoiceLayoutService: InvoiceLayoutService,
    private readonly notificationService: NotificationsService,
  ) {}

  // business infos
  @Get('business-info')
  @Roles('USER', 'ADMIN')
  @ApiOperation({ summary: 'Get business info ( USER, ADMIN )' })
  @ApiResponse({ status: 200, description: 'Business info retrieved successfully' })
  getBusinessInfo(@User() user: jwtPayload) {
    return this.settingsService.getBusinessInfo(user.sub);
  }

  @Patch('update-business-info')
  @Roles('USER', 'ADMIN')
  @ApiOperation({ summary: 'Update business info ( USER, ADMIN )' })
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiResponse({ status: 200, description: 'Business info updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid business info data' })
  async updateBusinessInfo(
    @Body() dto: BusinessInfoDto,
    @User() user: jwtPayload,
  ) {
    const userId: string = user.sub;
    return await this.settingsService.updateBusinessInfo(userId, dto);
  }

  @Patch('update-business-logo')
  @Roles('USER', 'ADMIN')
  @ApiOperation({ summary: 'Update business logo ( USER, ADMIN )' })
  @ApiBody({ type: UpdateLogoDto })
  @ApiResponse({ status: 200, description: 'Business logo updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid logo data' })
  updateBusinessLogo(
    @User() user: jwtPayload,
    @Body() dto: UpdateLogoDto,
  ) {
    return this.settingsService.updateBusinessLogo(user.sub, dto.logo);
  }

  @Patch('remove-business-logo')
  @Roles('USER', 'ADMIN')
  @ApiOperation({ summary: 'Remove business logo ( USER, ADMIN )' })
  @ApiResponse({ status: 200, description: 'Business logo removed successfully' })
  removeBusinessLogo(@User() user: jwtPayload) {
    return this.settingsService.removeBusinessLogo(user.sub);
  }

  // payment method
  @Post('create-payment-method')
  @Roles('USER', 'ADMIN')
  @ApiOperation({ summary: 'Create payment method ( USER, ADMIN )' })
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiResponse({ status: 201, description: 'Payment method created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid payment method data' })
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
  @ApiOperation({ summary: 'Update payment method ( USER, ADMIN )' })
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiResponse({ status: 200, description: 'Payment method updated successfully' })
  @ApiResponse({ status: 404, description: 'Payment method not found' })
  updatePaymentMethod(
    @Param('id') id: string,
    @Body() dto: UpdatePaymentMethodDto,
  ) {
    return this.paymentMethodService.updatePaymentMethod(id, dto);
  }

  @Get('payment-methods')
  @Roles('USER', 'ADMIN')
  @ApiOperation({ summary: 'Get payment methods ( USER, ADMIN )' })
  @ApiResponse({ status: 200, description: 'Payment methods retrieved successfully' })
  getPaymentMethods(@User() user: jwtPayload) {
    return this.paymentMethodService.getPaymentMethods(user.sub);
  }

  @Patch('make-payment-default/:id')
  @Roles('USER', 'ADMIN')
  @ApiOperation({ summary: 'Make payment default ( USER, ADMIN )' })
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
  @ApiResponse({ status: 200, description: 'Payment method set as default successfully' })
  @ApiResponse({ status: 404, description: 'Payment method not found' })
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

  @Delete('delete-payment-method')
  @Roles('USER', 'ADMIN')
  @ApiOperation({ summary: 'Delete payment method ( USER, ADMIN )' })
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiResponse({ status: 204, description: 'Payment method deleted successfully' })
  @ApiResponse({ status: 404, description: 'Payment method not found' })
  deletePaymentMethods(
    @User() user: jwtPayload,
    @Param('paymentMethodId') dto: { paymentMethodId: string },
  ) {
    return this.paymentMethodService.deletePaymentMethods(
      user.sub,
      dto.paymentMethodId,
    );
  }

  //invoice layout
  @Get('invoice-layout')
  @Roles('USER', 'ADMIN')
  @ApiOperation({ summary: 'Get invoice layout ( USER, ADMIN )' })
  @ApiResponse({ status: 200, description: 'Invoice layout retrieved successfully' })
  getInvoiceLayout(@User() user: jwtPayload) {
    return this.invoiceLayoutService.findByUser(user.sub);
  }

  @Patch('update-invoice-layout')
  @Roles('USER', 'ADMIN')
  @ApiOperation({ summary: 'Update invoice layout ( USER, ADMIN )' })
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiResponse({ status: 200, description: 'Invoice layout updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid layout data' })
  invoiceLayout(@Body() dto: InvoiceLayoutDto, @User() user: jwtPayload) {
    return this.invoiceLayoutService.updateLayout(user.sub, dto);
  }

  // notification settings
  @Get('notification-settings')
  @Roles('USER', 'ADMIN')
  @ApiOperation({ summary: 'Get notification settings ( USER, ADMIN )' })
  @ApiResponse({ status: 200, description: 'Notification settings retrieved successfully' })
  getNotificationSettings(@User() user: jwtPayload) {
    return this.notificationService.getPreferences(user.sub);
  }

  @Patch('update-notification-settings')
  @Roles('USER', 'ADMIN')
  @ApiOperation({ summary: 'Update notification settings ( USER, ADMIN )' })
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiResponse({ status: 200, description: 'Notification settings updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid notification settings' })
  updateNotificationSettings(
    @User() user: jwtPayload,
    @Body() dto: UpdateNotificationSettingsDto,
  ) {
    return this.notificationService.updatePreferences(user, dto);
  }
}
