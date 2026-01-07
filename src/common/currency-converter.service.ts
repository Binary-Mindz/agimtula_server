import { Injectable } from '@nestjs/common';

@Injectable()
export class CurrencyConverterService {
  private readonly exchangeRates = {
    EUR: 1,
    BDT: 0.0085, // 1 BDT = 0.0085 EUR
    USD: 0.92,   // 1 USD = 0.92 EUR
  };

  convertToEUR(amount: number, fromCurrency: string): number {
    const rate = this.exchangeRates[fromCurrency] || 1;
    return amount * rate;
  }
}