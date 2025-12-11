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
import { Roles } from 'src/auth/decorators/roles.decorator';

@Controller('mileage')
export class MileageController {
  constructor(private readonly mileageService: MileageService) {}

  @Post('log-trip')
  @Roles('USER')
  @UsePipes(new ValidationPipe({ transform: true }))
  async logTrip(@Body() dto: LogTripDto) {
    return await this.mileageService.logTrip(dto);
  }
}
