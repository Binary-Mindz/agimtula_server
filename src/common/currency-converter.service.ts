import { Injectable } from '@nestjs/common';

@Injectable()
export class CurrencyConverterService {
  private readonly exchangeRates = {
    EUR: 1,
    BDT: 0.0085,
    USD: 0.92,
  };

  convertToEUR(amount: number, fromCurrency: string): number {
    const rate = this.exchangeRates[fromCurrency] || 1;
    return amount * rate;
  }
}