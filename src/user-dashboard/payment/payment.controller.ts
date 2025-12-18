import {
  Controller,
  Get,
  Post,
  Body,
  // Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
// import { CreatePaymentDto } from './dto/create-payment.dto';
// import { UpdatePaymentDto } from './dto/update-payment.dto';
import { User } from 'src/auth/decorators/user.decorator';
import { jwtPayload } from 'src/auth/types/jwt-payload';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { ApiBody } from '@nestjs/swagger';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('buy-plan/:id')
  @Roles('USER', 'ACCOUNTANT', 'ADMIN')
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
  buyPlan(
    @Param('id') id: string,
    @User() user: jwtPayload,
    @Body('billingPeriod') billingPeriod: 'MONTHLY' | 'YEARLY',
  ) {
    return this.paymentService.buyPlan(user.sub, id, billingPeriod);
  }

  @Get()
  findAll() {
    return this.paymentService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.paymentService.findOne(+id);
  }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updatePaymentDto: UpdatePaymentDto) {
  //   return this.paymentService.update(+id, updatePaymentDto);
  // }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.paymentService.remove(+id);
  }
}
