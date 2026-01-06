
import { BadRequestException, Injectable } from '@nestjs/common';
import { cResponseData } from 'src/common/cResponse';
import { PrismaService } from 'src/config/database/prisma.service';

export interface TransactionRow {
  date: string;
  description: string;
  category?: string;
  amount: number;
  currency: string;
  status: 'MATCHED' | 'UNMATCHED';
  linkedInvoiceId?: string;
  attachments?: string[];
  from?: string;
  accountId?: string;
}

interface TokenData {
  access_token: string;
  [key: string]: unknown;
}

interface Amount {
  value: {
    unscaledValue: number;
    scale: number;
  };
  currencyCode: string;
}

interface Transaction {
  amount: Amount;
  dates: {
    booked: string;
  };
  descriptions: {
    display: string;
    original: string;
  };
  accountId?: string;
  account?: {
    accountNumber?: string;
    name?: string;
  };
  [key: string]: unknown;
}

interface TransactionData {
  transactions: Transaction[];
}

interface Account {
  id: string;
  accountNumber: string;
  name: string;
  type: string;
  balance: number;
  bankId: string;
  credentialsId: string;
  currencyCode: string;
  iban?: string;
  holderName?: string;
  [key: string]: unknown;
}

@Injectable()
export class TinkService {
  private apiUrl = 'https://api.tink.com';

  constructor(private prisma: PrismaService) { }

  async getBankName(bankId: string, accessToken: string): Promise<string> {
    try {
      const res = await fetch(`${this.apiUrl}/api/v1/providers/${bankId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (res.ok) {
        const bankData = await res.json();
        return bankData.displayName || 'Tink Bank';
      }
    } catch (error) {
      console.error('Error fetching bank name:', error);
    }
    return 'Tink Bank';
  }


  async getOrCreateBank(
    account: Account,
  ): Promise<string> {
    const existingBank = await this.prisma.bank.findFirst({
      where: {
        accountId: account.id,
      },
    });

    if (existingBank) {
      return existingBank.id;
    }

    const newBank = await this.prisma.bank.create({
      data: {
        accountId: account.id,
        accountNumber: account.accountNumber,
        name: account.name,
        type: account.type,
        bankName: 'Tink Bank',
        balance: account.balance,
        currencyCode: account.currencyCode,
        iban: account.iban,
        holderName: account.holderName,
        bankId: account.bankId,
        credentialsId: account.credentialsId,
      },
    });

    return newBank.id;
  }


  async matchAccountIdWithNumber(accountId: string, accountNumber: string): Promise<void> {
    await this.prisma.bank.updateMany({
      where: {
        OR: [
          { accountId },
          { accountNumber: { contains: accountNumber } },
        ],
      },
      data: { accountId },
    });
  }


  async updateBankLastSync(bankId: string): Promise<void> {
    await this.prisma.bank.update({
      where: { id: bankId },
      data: { lastSync: new Date() },
    });
  }

  // async saveTransactions(
  //   transactions: TransactionRow[],
  // ): Promise<number> {
  //   let savedCount = 0;

  //   for (const transaction of transactions) {
  //     try {
  //       await this.prisma.transaction.create({
  //         data: {
  //           date: new Date(transaction.date),
  //           description: transaction.description,
  //           amount: transaction.amount,
  //           currency: transaction.currency,
  //           status: transaction.status,
  //           source: 'Bank',
  //           attachments: transaction.attachments || [],
  //           accountId: transaction.accountId, // Store accountId from transaction
  //         },
  //       });
  //       savedCount++;
  //     } catch (error) {
  //       // Skip duplicate transactions (unique constraint violation)
  //       if (error.code === 'P2002') {
  //         console.log(
  //           `Skipping duplicate transaction: ${transaction.description}`,
  //         );
  //         continue;
  //       }
  //       throw error;
  //     }
  //   }

  //   return savedCount;
  // }


  async exchangeToken(code: string): Promise<TokenData> {
    const clientId =
      process.env.TINK_CLIENT_ID || 'b84ee12c366a4eaf97b1c376dd25934d';
    const clientSecret =
      process.env.TINK_CLIENT_SECRET || '8d5c0a8c21a9413480ade6b99f50ae5b';

    if (!clientSecret) {
      throw new Error(
        'TINK_CLIENT_SECRET is not configured. Please set it in .env file.',
      );
    }

    const body = new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'authorization_code',
    });

    const res = await fetch(`${this.apiUrl}/api/v1/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    if (!res.ok) {
      const errorBody = await res.text();
      console.error('Tink API Error Response:', errorBody);
      console.error('Request Body (masked):', {
        code: code.substring(0, 10) + '...',
        client_id: clientId.substring(0, 10) + '...',
        client_secret: '***MASKED***',
        grant_type: 'authorization_code',
      });
      throw new Error(
        `Tink token error: ${res.status} - ${res.statusText}. Response: ${errorBody}`,
      );
    }
    return (await res.json()) as TokenData;
  }

  async getTransactions(
    accessToken: string,
  ): Promise<TransactionRow[]> {
    const res = await fetch(`${this.apiUrl}/data/v2/transactions`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(
        `Failed to fetch transactions: ${res.status} - ${res.statusText}`,
      );
    }

    const data = (await res.json()) as TransactionData;

    return (
      data.transactions?.map((trx: Transaction) => {
        const { amount, currency } = this.parseTransactionAmount(trx);
        return {
          date: trx.dates.booked,
          description: trx.descriptions.display,
          category: trx.descriptions.original || 'Not categorized',
          amount,
          currency,
          status: 'UNMATCHED' as const,
          from: 'Tink Bank',
          accountId: trx.accountId,
        };
      }) || []
    );
  }


  async getTransactionsWithAccountInfo(
    accessToken: string,
  ): Promise<{ transactions: TransactionRow[]; accounts: any[] }> {
    const accountsData = await this.fetchConnectedAccounts(accessToken);

    const transactions = await this.getTransactions(accessToken);

    return { transactions, accounts: accountsData?.accounts || [] };
  }


  parseTransactionAmount(transaction: Transaction): {
    amount: number;
    currency: string;
  } {
    const { unscaledValue, scale } = transaction.amount.value;
    const amount = unscaledValue / 10 ** scale;
    return {
      amount,
      currency: transaction.amount.currencyCode,
    };
  }


  formatTransactions(transactions: Transaction[]) {
    return transactions.map((trx) => {
      const { amount, currency } = this.parseTransactionAmount(trx);
      return {
        description: trx.descriptions.display,
        amount: amount.toFixed(2),
        currency,
        date: trx.dates.booked,
        raw: trx,
      };
    });
  }

  async fetchConnectedAccounts(accessToken: string) {
    try {
      const res = await fetch('https://api.tink.com/api/v1/accounts/list', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch accounts: ${res.status}`);
      }

      const data = await res.json();
      console.log('data from fetchConnectedAccounts', data);

      return {
        accounts: data.accounts.map((account: any) => ({
          id: account.id,
          accountNumber: account.accountNumber,
          name: account.name,
          type: account.type,
          balance: account.balance,
          currencyCode: account.currencyCode,
          iban: account.iban,
          holderName: account.holderName,
          bankId: account.bankId,
          credentialsId: account.credentialsId,
        })),
      };
    } catch (err) {
      console.error('Error fetching accounts:', err.message);
    }
  }

  async storeMyTransaction(userId: string, transactions: TransactionRow[], accessToken: string) {
    try {
      const userExit = await this.prisma.user.findFirst({
        where: {
          id: userId
        }
      })
      if (!userExit) {
        throw new BadRequestException('User not found');
      }
      await this.prisma.user.update({
        where: {
          id: userId
        },
        data: {
          tinkAccessToken: accessToken
        }
      })
      await this.prisma.transaction.createMany({
        data: transactions.map(transaction => ({
          date: new Date(transaction.date),
          description: transaction.description,
          amount: transaction.amount,
          currency: transaction.currency,
          status: transaction.status,
          source: 'Tink Bank',
          attachments: transaction.attachments || [],
          accountId: transaction.accountId,
          userId
        })),
        skipDuplicates: true,
      });
      return cResponseData({
        message: 'Tink Bank Transactions stored successfully'
      });
    } catch (error) {
      console.error('Error storing transactions:', error);
      throw new BadRequestException('Failed to store transactions');
    }
  }
}





