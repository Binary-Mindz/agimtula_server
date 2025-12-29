import { Injectable } from '@nestjs/common';

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
  [key: string]: unknown;
}

interface TransactionData {
  transactions: Transaction[];
}

@Injectable()
export class TinkService {
  private apiUrl = 'https://api.tink.com';

  /**
   * Exchange authorization code for access token
   */
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

  /**
   * Fetch transactions using access token and return as TransactionRow[]
   */
  async getTransactions(accessToken: string): Promise<TransactionRow[]> {
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

    // Convert to TransactionRow format
    return data.transactions?.map((trx: Transaction) => {
      const { amount, currency } = this.parseTransactionAmount(trx);
      return {
        date: trx.dates.booked,
        description: trx.descriptions.display,
        category: trx.descriptions.original || 'Not categorized',
        amount,
        currency,
        status: 'UNMATCHED' as const,
        from: 'Tink Bank',
      };
    }) || [];
  }

  /**
   * Parse transaction amount
   */
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

  /**
   * Format transactions for display
   */
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
}
