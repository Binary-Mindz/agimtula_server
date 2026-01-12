import { Body, Controller, Post } from '@nestjs/common';
import { RequestAccountantService } from './request-accountant.service';
import { Roles } from 'src/decorators/roles.decorator';
import { RequestAccountant } from './dto/request-accountant.dto';
import { User } from 'src/decorators/user.decorator';
import { jwtPayload } from 'src/auth/types/jwt-payload';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('request-accountant')
export class RequestAccountantController {
  constructor(
    private readonly requestAccountantService: RequestAccountantService,
  ) { }

  @Post()
  @Roles('USER')
  @ApiOperation({ summary: 'Request accountant ( USER only )' })
  @ApiResponse({ status: 201, description: 'Accountant request submitted successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  async requestAccountant(@Body() dto: RequestAccountant, @User() user: jwtPayload) {
    return await this.requestAccountantService.requestAccountant(user.sub, dto);
  }
}
