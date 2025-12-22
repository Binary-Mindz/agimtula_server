import { Module } from '@nestjs/common';
import { MileageService } from './mileage.service';
import { UserMileageController } from './mileage.controller';

@Module({
  controllers: [UserMileageController],
  providers: [MileageService],
})
export class MileageModule {}
