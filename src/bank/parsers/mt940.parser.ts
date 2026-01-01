import { Injectable, Logger } from '@nestjs/common';

export interface Balance {
  type: string;
  date: string;
  currency: string;
  amount: number;
}

export interface Transaction {
  valueDate: string;
  entryDate: string | null;
  type: string;
  amount: number;
  transactionType: string;
  reference: string;
  details?: string;
}

export interface MT940Result {
  transactions: Transaction[];
  metadata: {
    transactionReference?: string;
    accountIdentification?: string;
    statementNumber?: string;
    openingBalance?: Balance;
    closingBalance?: Balance;
  };
}

@Injectable()
export class MT940Parser {
  private readonly logger = new Logger(MT940Parser.name);

  parseMT940(content: string): MT940Result {
    this.logger.log('Parsing MT940 file...');

    const result: MT940Result = {
      transactions: [],
      metadata: {},
    };

    try {
      const lines = content.split('\n').map(line => line.trim()).filter(line => line);

      let currentTransaction: any = null;

      for (const line of lines) {
        // Transaction Reference Number
        if (line.startsWith(':20:')) {
          result.metadata.transactionReference = line.substring(4);
        }
        // Account Identification
        else if (line.startsWith(':25:')) {
          result.metadata.accountIdentification = line.substring(4);
        }
        // Statement Number
        else if (line.startsWith(':28C:')) {
          result.metadata.statementNumber = line.substring(5);
        }
        // Opening Balance
        else if (line.startsWith(':60F:') || line.startsWith(':60M:')) {
          const balance = this.parseBalance(line.substring(5));
          result.metadata.openingBalance = balance;
        }
        // Closing Balance
        else if (line.startsWith(':62F:') || line.startsWith(':62M:')) {
          const balance = this.parseBalance(line.substring(5));
          result.metadata.closingBalance = balance;
        }
        // Transaction Line
        else if (line.startsWith(':61:')) {
          if (currentTransaction) {
            result.transactions.push(currentTransaction);
          }
          currentTransaction = this.parseTransactionLine(line.substring(4));
        }
        // Transaction Details
        else if (line.startsWith(':86:') && currentTransaction) {
          currentTransaction.details = line.substring(4);
        }
      }

      if (currentTransaction) {
        result.transactions.push(currentTransaction);
      }

      this.logger.log(`✅ Successfully parsed MT940 file`);
      this.logger.log(`Account: ${result.metadata.accountIdentification}`);
      this.logger.log(`Opening Balance: ${JSON.stringify(result.metadata.openingBalance)}`);
      this.logger.log(`Closing Balance: ${JSON.stringify(result.metadata.closingBalance)}`);
      this.logger.log(`Total Transactions: ${result.transactions.length}`);

      console.log('\n========== MT940 FILE DATA ==========');
      console.log('Metadata:', JSON.stringify(result.metadata, null, 2));
      console.log('\nTransactions:');
      result.transactions.forEach((txn, idx) => {
        console.log(`\n--- Transaction ${idx + 1} ---`);
        console.log(JSON.stringify(txn, null, 2));
      });
      console.log('\n=====================================\n');

      return result;
    } catch (error) {
      this.logger.error('Error parsing MT940 file:', error.message);
      throw error;
    }
  }

  private parseBalance(line: string): Balance {
    // Format: C/D YY MM DD CUR AMOUNT
    // Example: C230930EUR12345,67
    const debitCredit = line.charAt(0); // C or D
    const date = line.substring(1, 7); // YYMMDD
    const currency = line.substring(7, 10); // Currency code
    const amount = line.substring(10).replace(',', '.');

    return {
      type: debitCredit === 'C' ? 'Credit' : 'Debit',
      date: this.parseDate(date),
      currency,
      amount: parseFloat(amount),
    };
  }

  private parseTransactionLine(line: string): Transaction {
    // Format: YYMMDD [MMDD] C/D AMOUNT [S][XXX][//REFERENCE]
    // Example: 2309301001DR500,00NTRFNONREF

    const valueDate = line.substring(0, 6); // YYMMDD
    let pos = 6;

    // Check for entry date (optional, MMDD)
    let entryDate: string | null = null;
    if (line.length > pos + 4 && /^\d{4}/.test(line.substring(pos, pos + 4))) {
      entryDate = line.substring(pos, pos + 4);
      pos += 4;
    }

    // Debit/Credit indicator
    const debitCredit = line.substring(pos, pos + 2);
    pos += 2;

    // Amount (until next non-digit/non-comma character)
    let amount = '';
    while (pos < line.length && /[\d,]/.test(line.charAt(pos))) {
      amount += line.charAt(pos);
      pos++;
    }

    // Rest is transaction type and reference
    const remaining = line.substring(pos);

    return {
      valueDate: this.parseDate(valueDate),
      entryDate: entryDate ? this.parseDate('20' + entryDate) : null,
      type: debitCredit.includes('D') ? 'Debit' : 'Credit',
      amount: parseFloat(amount.replace(',', '.')),
      transactionType: remaining.substring(0, 4) || 'UNKNOWN',
      reference: remaining.substring(4) || '',
    };
  }

  private parseDate(dateStr: string): string {
    if (dateStr.length === 6) {
      // YYMMDD format
      const year = '20' + dateStr.substring(0, 2);
      const month = dateStr.substring(2, 4);
      const day = dateStr.substring(4, 6);
      return `${year}-${month}-${day}`;
    } else if (dateStr.length === 8) {
      // YYYYMMDD format
      const year = dateStr.substring(0, 4);
      const month = dateStr.substring(4, 6);
      const day = dateStr.substring(6, 8);
      return `${year}-${month}-${day}`;
    }
    return dateStr;
  }
}
