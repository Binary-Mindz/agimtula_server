import { Module } from '@nestjs/common';
import { MileageService } from './mileage.service';
import { UserMileageController } from './mileage.controller';
import { ActivityLogModule } from 'src/common/activity-log/activity-log.module';

@Module({
  imports: [ActivityLogModule],
  controllers: [UserMileageController],
  providers: [MileageService],
})
export class MileageModule {}
