import { BadRequestException, Injectable, Logger } from '@nestjs/common';
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
  private readonly logger = new Logger(TinkService.name);
  private apiUrl = 'https://api.tink.com';

  constructor(private prisma: PrismaService) {
    this.logger.log('TinkService initialized');
    this.logger.debug(`API URL: ${this.apiUrl}`);
  }

  async getBankName(bankId: string, accessToken: string): Promise<string> {
    try {
      this.logger.log(`Fetching bank name for bankId: ${bankId}`);

      const res = await fetch(`${this.apiUrl}/api/v1/providers/${bankId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (res.ok) {
        const bankData = await res.json();
        const bankName = bankData.displayName || 'Tink Bank';
        this.logger.log(`Bank name retrieved: ${bankName} for bankId: ${bankId}`);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return bankName;
      }

      this.logger.warn(`Failed to fetch bank name for bankId: ${bankId}, status: ${res.status}`);
    } catch (error) {
      this.logger.error(`Error fetching bank name for bankId ${bankId}: ${error.message}`, error.stack);
    }

    this.logger.debug('Returning default bank name: Tink Bank');
    return 'Tink Bank';
  }

  async getOrCreateBank(account: Account): Promise<string> {
    try {
      this.logger.log(`Getting or creating bank for account: ${account.id}`);

      const existingBank = await this.prisma.bank.findFirst({
        where: {
          accountId: account.id,
        },
      });

      if (existingBank) {
        this.logger.log(`Bank already exists with ID: ${existingBank.id} for account: ${account.id}`);
        return existingBank.id;
      }

      this.logger.log(`Creating new bank entry for account: ${account.id}`);
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

      this.logger.log(`New bank created successfully with ID: ${newBank.id} for account: ${account.id}`);
      return newBank.id;
    } catch (error) {
      this.logger.error(`Failed to get or create bank for account ${account.id}: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to get or create bank');
    }
  }

  async matchAccountIdWithNumber(accountId: string, accountNumber: string): Promise<void> {
    try {
      this.logger.log(`Matching accountId: ${accountId} with accountNumber: ${accountNumber}`);

      const result = await this.prisma.bank.updateMany({
        where: {
          OR: [
            { accountId },
            { accountNumber: { contains: accountNumber } },
          ],
        },
        data: { accountId },
      });

      this.logger.log(`Account matching completed - Updated ${result.count} records`);
    } catch (error) {
      this.logger.error(`Failed to match account ${accountId} with number ${accountNumber}: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to match account');
    }
  }

  async updateBankLastSync(bankId: string): Promise<void> {
    try {
      this.logger.log(`Updating last sync time for bank: ${bankId}`);

      await this.prisma.bank.update({
        where: { id: bankId },
        data: { lastSync: new Date() },
      });

      this.logger.log(`Last sync time updated successfully for bank: ${bankId}`);
    } catch (error) {
      this.logger.error(`Failed to update last sync for bank ${bankId}: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to update bank sync time');
    }
  }

  async exchangeToken(code: string): Promise<TokenData> {
    try {
      this.logger.log('Exchanging authorization code for access token');
      this.logger.debug(`Auth code: ${code.substring(0, 10)}...`);

      const clientId =
        process.env.TINK_CLIENT_ID || 'b84ee12c366a4eaf97b1c376dd25934d';
      const clientSecret =
        process.env.TINK_CLIENT_SECRET || '8d5c0a8c21a9413480ade6b99f50ae5b';

      if (!clientSecret) {
        this.logger.error('TINK_CLIENT_SECRET is not configured');
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
        this.logger.error(`Tink token exchange failed: ${res.status} - ${res.statusText}`);
        this.logger.error(`Error response: ${errorBody}`);
        this.logger.debug('Request Body (masked):', {
          code: code.substring(0, 10) + '...',
          client_id: clientId.substring(0, 10) + '...',
          client_secret: '***MASKED***',
          grant_type: 'authorization_code',
        });
        throw new Error(
          `Tink token error: ${res.status} - ${res.statusText}. Response: ${errorBody}`,
        );
      }

      this.logger.log('Access token exchanged successfully');
      return (await res.json()) as TokenData;
    } catch (error) {
      this.logger.error(`Token exchange failed: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to exchange token');
    }
  }

  async getTransactions(accessToken: string): Promise<TransactionRow[]> {
    try {
      this.logger.log('Fetching transactions from Tink API');

      const res = await fetch(`${this.apiUrl}/data/v2/transactions`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        this.logger.error(`Failed to fetch transactions: ${res.status} - ${res.statusText}`);
        throw new Error(
          `Failed to fetch transactions: ${res.status} - ${res.statusText}`,
        );
      }

      const data = (await res.json()) as TransactionData;
      const transactionCount = data.transactions?.length || 0;

      this.logger.log(`Successfully fetched ${transactionCount} transactions`);

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
    } catch (error) {
      this.logger.error(`Failed to get transactions: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to fetch transactions');
    }
  }

  async getTransactionsWithAccountInfo(
    accessToken: string,
  ): Promise<{ transactions: TransactionRow[]; accounts: any[] }> {
    try {
      this.logger.log('Fetching transactions with account info');

      const accountsData = await this.fetchConnectedAccounts(accessToken);
      const transactions = await this.getTransactions(accessToken);

      const accountCount = accountsData?.accounts?.length || 0;
      this.logger.log(`Retrieved ${transactions.length} transactions and ${accountCount} accounts`);

      return { transactions, accounts: accountsData?.accounts || [] };
    } catch (error) {
      this.logger.error(`Failed to get transactions with account info: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to fetch transactions with account info');
    }
  }

  parseTransactionAmount(transaction: Transaction): {
    amount: number;
    currency: string;
  } {
    try {
      const { unscaledValue, scale } = transaction.amount.value;
      const amount = unscaledValue / 10 ** scale;

      this.logger.debug(`Parsed transaction amount: ${amount} ${transaction.amount.currencyCode}`);

      return {
        amount,
        currency: transaction.amount.currencyCode,
      };
    } catch (error) {
      this.logger.error(`Failed to parse transaction amount: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to parse transaction amount');
    }
  }

  formatTransactions(transactions: Transaction[]) {
    try {
      this.logger.log(`Formatting ${transactions.length} transactions`);

      const formatted = transactions.map((trx) => {
        const { amount, currency } = this.parseTransactionAmount(trx);
        return {
          description: trx.descriptions.display,
          amount: amount.toFixed(2),
          currency,
          date: trx.dates.booked,
          raw: trx,
        };
      });

      this.logger.log(`Successfully formatted ${formatted.length} transactions`);
      return formatted;
    } catch (error) {
      this.logger.error(`Failed to format transactions: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to format transactions');
    }
  }

  async fetchConnectedAccounts(accessToken: string) {
    try {
      this.logger.log('Fetching connected accounts from Tink API');

      const res = await fetch('https://api.tink.com/api/v1/accounts/list', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!res.ok) {
        this.logger.error(`Failed to fetch accounts: ${res.status}`);
        throw new Error(`Failed to fetch accounts: ${res.status}`);
      }

      const data = await res.json();
      const accountCount = data.accounts?.length || 0;

      this.logger.log(`Successfully fetched ${accountCount} connected accounts`);
      this.logger.debug(`Account data: ${JSON.stringify(data)}`);

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
    } catch (error) {
      this.logger.error(`Error fetching connected accounts: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to fetch connected accounts');
    }
  }

  async storeMyTransaction(userId: string, transactions: TransactionRow[], accessToken: string) {
    try {
      this.logger.log(`Starting transaction storage for user: ${userId}`);
      this.logger.log(`Number of transactions to store: ${transactions.length}`);

      const userExit = await this.prisma.user.findFirst({
        where: {
          id: userId
        }
      });

      if (!userExit) {
        this.logger.warn(`User not found: ${userId}`);
        throw new BadRequestException('User not found');
      }

      this.logger.log(`Updating Tink access token for user: ${userId}`);
      await this.prisma.user.update({
        where: {
          id: userId
        },
        data: {
          tinkAccessToken: accessToken
        }
      });

      this.logger.log(`Storing ${transactions.length} transactions in database`);
      const result = await this.prisma.transaction.createMany({
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

      this.logger.log(`Successfully stored ${result.count} transactions for user: ${userId}`);

      return cResponseData({
        message: 'Tink Bank Transactions stored successfully',
        data: { count: result.count }
      });
    } catch (error) {
      this.logger.error(`Failed to store transactions for user ${userId}: ${error.message}`, error.stack);

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException('Failed to store transactions');
    }
  }
}





