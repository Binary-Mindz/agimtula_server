import { Body, Controller, Post } from '@nestjs/common';
import { RequesteAccountantService } from './request-accountant.service';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RequestAccountant } from './dto/request-accountant.dto';
import { User } from 'src/auth/decorators/user.decorator';
import { jwtPayload } from 'src/auth/types/jwt-payload';

@Controller('requeste-accountant')
export class RequesteAccountantController {
  constructor(
    private readonly requesteAccountantService: RequesteAccountantService,
  ) {}

  @Post()
  @Roles('USER')
  requestAccountant(@Body() dto: RequestAccountant, @User() user: jwtPayload) {
    return this.requesteAccountantService.requestAccountant(user.sub, dto);
  }
}
