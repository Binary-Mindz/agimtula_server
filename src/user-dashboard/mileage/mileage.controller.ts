import {
  Controller,
  Post,
  Body,
  UsePipes,
  ValidationPipe,
  Get,
} from '@nestjs/common';
import { MileageService } from './mileage.service';
import { LogTripDto } from './dto/log-trip.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { jwtPayload } from 'src/auth/types/jwt-payload';
import { User } from 'src/auth/decorators/user.decorator';

@Controller('mileage')
export class MileageController {
  constructor(private readonly mileageService: MileageService) {}

  @Post('log-trip')
  @Roles('USER')
  @UsePipes(new ValidationPipe({ transform: true }))
  async logTrip(@Body() dto: LogTripDto, @User() user: jwtPayload) {
    return await this.mileageService.logTrip(user.sub, dto);
  }

  @Get('mileage-track')
  @Roles('USER')
  async getMileageTrack(@User() user: jwtPayload) {
    return await this.mileageService.getMileageTrack(user.sub);
  }
}
