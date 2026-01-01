import { Module } from '@nestjs/common';
import { BankDataController } from './bank-data.controller';
import { BankDataService } from './bank-data.service';
import { DatabaseModule } from 'src/config/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [BankDataController],
  providers: [BankDataService],
  exports: [BankDataService]
})
export class BankDataModule {}