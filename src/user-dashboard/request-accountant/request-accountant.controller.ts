import { Body, Controller, Post } from '@nestjs/common';
import { RequesteAccountantService } from './request-accountant.service';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RequestAccountant } from './dto/request-accountant.dto';
import { User } from 'src/auth/decorators/user.decorator';
import { jwtPayload } from 'src/auth/types/jwt-payload';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('requeste-accountant')
export class RequesteAccountantController {
  constructor(
    private readonly requesteAccountantService: RequesteAccountantService,
  ) { }

  @Post()
  @Roles('USER')
  @ApiOperation({ summary: 'Request accountant ( USER only )' })
  @ApiResponse({ status: 201, description: 'Accountant request submitted successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  async requestAccountant(@Body() dto: RequestAccountant, @User() user: jwtPayload) {
    return await this.requesteAccountantService.requestAccountant(user.sub, dto);
  }
}
