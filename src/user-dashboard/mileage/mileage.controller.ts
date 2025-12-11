import {
  Controller,
  Post,
  Body,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { MileageService } from './mileage.service';
import { LogTripDto } from './dto/log-trip.dto';
import { JwtAccessGuard } from 'src/auth/guards/jwt/jwt-access.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles/roles.guard';

@Controller('mileage')
export class MileageController {
  constructor(private readonly mileageService: MileageService) {}

  @Post('log-trip')
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles('USER')
  @UsePipes(new ValidationPipe({ transform: true }))
  async logTrip(@Body() dto: LogTripDto) {
    return await this.mileageService.logTrip(dto);
  }
}
