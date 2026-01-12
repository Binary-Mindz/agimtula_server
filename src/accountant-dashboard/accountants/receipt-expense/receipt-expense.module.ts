import { Module } from '@nestjs/common';
import { ReceiptExpenseService } from './receipt-expense.service';
import { ReceiptExpenseController } from './receipt-expense.controller';
import { ValidateAccountantAccess } from '../validate-accountant-access';

@Module({
  controllers: [ReceiptExpenseController],
  providers: [ReceiptExpenseService, ValidateAccountantAccess],
})
export class ReceiptExpenseModule {}
