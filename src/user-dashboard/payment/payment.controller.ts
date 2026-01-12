import {
  Controller,
  // Get,
  Post,
  Body,
  // Patch,
  Param,
  // Delete,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
// import { CreatePaymentDto } from './dto/create-payment.dto';
// import { UpdatePaymentDto } from './dto/update-payment.dto';
import { User } from 'src/decorators/user.decorator';
import { jwtPayload } from 'src/auth/types/jwt-payload';
import { Roles } from 'src/decorators/roles.decorator';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { urlPrefix } from '../url-prefix';

@Controller(`${urlPrefix}/payment`)
export class UserPaymentController {
  constructor(private readonly paymentService: PaymentService) { }

  @Post('buy-plan/:id')
  @Roles('USER')
  @ApiOperation({ summary: 'Buy plan ( USER only )' })
  @ApiBody({
    schema: {
      type: 'object',
      example: {
        billingPeriod: 'MONTHLY',
      },
      properties: {
        billingPeriod: {
          type: 'string',
          enum: ['MONTHLY', 'YEARLY'],
          default: 'MONTHLY',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Plan purchased successfully' })
  @ApiResponse({ status: 400, description: 'Invalid plan or billing period' })
  buyPlan(
    @Param('id') id: string,
    @User() user: jwtPayload,
    @Body('billingPeriod') billingPeriod: 'MONTHLY' | 'YEARLY',
  ) {
    return this.paymentService.buyPlan(user.sub, id, billingPeriod, user);
  }

  @Post('upgrade-plan/:id')
  @Roles('USER')
  @ApiOperation({ summary: 'Upgrade plan ( USER only )' })
  @ApiBody({
    schema: {
      type: 'object',
      example: {
        billingPeriod: 'MONTHLY',
      },
      properties: {
        billingPeriod: {
          type: 'string',
          enum: ['MONTHLY', 'YEARLY'],
          default: 'MONTHLY',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Plan upgraded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid plan or billing period' })
  upgradePlan(
    @Param('id') id: string,
    @User() user: jwtPayload,
    @Body('billingPeriod') billingPeriod: 'MONTHLY' | 'YEARLY',
  ) {
    return this.paymentService.upgradePlan(user.sub, id, billingPeriod, user);
  }

  // @Get()
  // @ApiResponse({ status: 200, description: 'Payments retrieved successfully' })
  // findAll() {
  //   return this.paymentService.findAll();
  // }

  // @Get(':id')
  // @ApiResponse({ status: 200, description: 'Payment retrieved successfully' })
  // @ApiResponse({ status: 404, description: 'Payment not found' })
  // findOne(@Param('id') id: string) {
  //   return this.paymentService.findOne(+id);
  // }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updatePaymentDto: UpdatePaymentDto) {
  //   return this.paymentService.update(+id, updatePaymentDto);
  // }

  // @Delete(':id')
  // @ApiResponse({ status: 204, description: 'Payment deleted successfully' })
  // @ApiResponse({ status: 404, description: 'Payment not found' })
  // remove(@Param('id') id: string) {
  //   return this.paymentService.remove(+id);
  // }
}
