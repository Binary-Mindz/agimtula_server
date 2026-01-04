import { Injectable, Logger } from '@nestjs/common';
import { XMLParser } from 'fast-xml-parser';

export interface Balance {
  amount: number;
  currency: string;
  creditDebitIndicator: string;
  date: string;
}

export interface TransactionDetail {
  amount: number;
  currency: string;
  creditDebitIndicator: string;
  debtorName?: string;
  debtorAccount?: string;
  creditorName?: string;
  creditorAccount?: string;
  remittanceInformation?: string;
  references: {
    endToEndId?: string;
    transactionId?: string;
    mandateId?: string;
  };
}

export interface Transaction {
  amount: number;
  currency: string;
  creditDebitIndicator: string;
  type: string;
  status: string;
  bookingDate: string;
  valueDate: string;
  accountServicerReference: string;
  transactionDetails: TransactionDetail[] | null;
}

export interface CAMT053Result {
  metadata: {
    statementId: string;
    accountId: string;
    accountCurrency: string;
    creationDateTime: string;
    fromDate: string;
    toDate: string;
    openingBalance: Balance | null;
    closingBalance: Balance | null;
  };
  transactions: Transaction[];
}

@Injectable()
export class CAMT053Parser {
  private readonly logger = new Logger(CAMT053Parser.name);
  private xmlParser: XMLParser;

  constructor() {
    this.xmlParser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
    });
  }

  parseCAMT053(content: string): CAMT053Result {
    this.logger.log('Parsing CAMT.053 XML file...');

    try {
      const jsonObj = this.xmlParser.parse(content);

      // Navigate through the XML structure
      const document = jsonObj.Document || jsonObj.BkToCstmrStmt?.Document;
      const statement = document?.BkToCstmrStmt || document?.CstmrStmt;
      const stmt = statement?.Stmt;

      if (!stmt) {
        throw new Error('Invalid CAMT.053 format: Could not find statement data');
      }

      const result: CAMT053Result = {
        metadata: {
          statementId: stmt.Id,
          accountId: stmt.Acct?.Id?.IBAN || stmt.Acct?.Id?.Othr?.Id,
          accountCurrency: stmt.Acct?.Ccy,
          creationDateTime: stmt.CreDtTm,
          fromDate: stmt.FrToDt?.FrDtTm,
          toDate: stmt.FrToDt?.ToDtTm,
          openingBalance: this.extractBalance(stmt.Bal, 'OPBD'),
          closingBalance: this.extractBalance(stmt.Bal, 'CLBD'),
        },
        transactions: [],
      };

      // Extract transactions
      const entries = Array.isArray(stmt.Ntry) ? stmt.Ntry : [stmt.Ntry].filter(Boolean);

      for (const entry of entries) {
        const transaction = {
          amount: parseFloat(entry.Amt?.['#text'] || entry.Amt || 0),
          currency: entry.Amt?.['@_Ccy'] || result.metadata.accountCurrency,
          creditDebitIndicator: entry.CdtDbtInd, // CRDT or DBIT
          type: entry.CdtDbtInd === 'CRDT' ? 'Credit' : 'Debit',
          status: entry.Sts,
          bookingDate: entry.BookgDt?.Dt || entry.BookgDt?.DtTm,
          valueDate: entry.ValDt?.Dt || entry.ValDt?.DtTm,
          accountServicerReference: entry.AcctSvcrRef,
          transactionDetails: this.extractTransactionDetails(entry.NtryDtls),
        };

        result.transactions.push(transaction);
      }

      this.logger.log(`✅ Successfully parsed CAMT.053 file`);
      this.logger.log(`Account: ${result.metadata.accountId}`);
      this.logger.log(`Opening Balance: ${JSON.stringify(result.metadata.openingBalance)}`);
      this.logger.log(`Closing Balance: ${JSON.stringify(result.metadata.closingBalance)}`);
      this.logger.log(`Total Transactions: ${result.transactions.length}`);

      console.log('\n========== CAMT.053 XML FILE DATA ==========');
      console.log('Metadata:', JSON.stringify(result.metadata, null, 2));
      console.log('\nTransactions:');
      result.transactions.forEach((txn, idx) => {
        console.log(`\n--- Transaction ${idx + 1} ---`);
        console.log(JSON.stringify(txn, null, 2));
      });
      console.log('\n===========================================\n');

      return result;
    } catch (error) {
      this.logger.error('Error parsing CAMT.053 file:', error.message);
      throw error;
    }
  }

  private extractBalance(balances: any, type: string): Balance | null {
    if (!balances) return null;

    const balanceArray = Array.isArray(balances) ? balances : [balances];
    const balance = balanceArray.find(b => b.Tp?.CdOrPrtry?.Cd === type);

    if (!balance) return null;

    return {
      amount: parseFloat(balance.Amt?.['#text'] || balance.Amt || 0),
      currency: balance.Amt?.['@_Ccy'],
      creditDebitIndicator: balance.CdtDbtInd,
      date: balance.Dt?.Dt || balance.Dt?.DtTm,
    };
  }

  private extractTransactionDetails(entryDetails: any): TransactionDetail[] | null {
    if (!entryDetails) return null;

    const detailsArray = Array.isArray(entryDetails) ? entryDetails : [entryDetails];
    const details: TransactionDetail[] = [];

    for (const detail of detailsArray) {
      const txDtls = Array.isArray(detail.TxDtls) ? detail.TxDtls : [detail.TxDtls].filter(Boolean);

      for (const tx of txDtls) {
        details.push({
          amount: parseFloat(tx.Amt?.['#text'] || tx.Amt || 0),
          currency: tx.Amt?.['@_Ccy'],
          creditDebitIndicator: tx.CdtDbtInd,
          debtorName: tx.RltdPties?.Dbtr?.Nm,
          debtorAccount: tx.RltdPties?.DbtrAcct?.Id?.IBAN || tx.RltdPties?.DbtrAcct?.Id?.Othr?.Id,
          creditorName: tx.RltdPties?.Cdtr?.Nm,
          creditorAccount: tx.RltdPties?.CdtrAcct?.Id?.IBAN || tx.RltdPties?.CdtrAcct?.Id?.Othr?.Id,
          remittanceInformation: tx.RmtInf?.Ustrd || tx.RmtInf?.Strd,
          references: {
            endToEndId: tx.Refs?.EndToEndId,
            transactionId: tx.Refs?.TxId,
            mandateId: tx.Refs?.MndtId,
          },
        });
      }
    }

    return details.length > 0 ? details : null;
  }
}
