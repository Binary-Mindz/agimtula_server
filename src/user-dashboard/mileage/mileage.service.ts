import { Injectable } from '@nestjs/common';
import { LogTripDto } from './dto/log-trip.dto';

@Injectable()
export class MileageService {
  async logTrip(dto: LogTripDto) {
    return dto;
  }
}
