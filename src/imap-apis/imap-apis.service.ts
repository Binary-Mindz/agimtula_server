/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import * as imaps from 'imap-simple';
import { simpleParser } from 'mailparser';
// import { CreateImapApiDto } from './dto/create-imap-api.dto';
import { PrismaService } from 'src/config/database/prisma.service';
import { cResponseData } from 'src/common/cResponse';
import { Response } from 'express';

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

export interface ImapClient {
  host: string;
  port: number;
  username: string;
  password: string;
}

@Injectable()
export class ImapApisService implements OnModuleInit, OnModuleDestroy {
  constructor(
    private schedulerRegistry: SchedulerRegistry,
    private prisma: PrismaService, // Your DB service
  ) { }

  private async imapClient({ host, port, username, password }: ImapClient) {
    return await imaps.connect({
      imap: {
        user: username,
        password,
        host,
        port,
        tls: true,
        authTimeout: 10000,
        tlsOptions: { rejectUnauthorized: false },
      },
    });
  }

  async onModuleInit() {
    // await this.readEmailByAccountTest()
    // await this.loadCronJobsFromDB();
    // const imapUserActive = await this.prisma.user.findMany({
    //   where: {
    //     email: { isNot: null },
    //     userSubscriptionPlan: {
    //       subscriptionPlanPaymentStatus: {
    //         paymentStatus: 'PAID',
    //       },
    //       expiredAt: { gt: new Date() },
    //     },
    //     imapConfigurations: {
    //       connect: true,
    //       sync: true,
    //     },
    //   },
    //   select: { imapConfigurations: true },
    // });
    // console.log(JSON.stringify(imapUserActive, null, 2));
  }

  async onModuleDestroy() {
    // Clean up cron jobs
    // const jobs = this.schedulerRegistry.getCronJobs();
    // for (const jobName of jobs.keys()) {
    //   const job = this.schedulerRegistry.getCronJob(jobName);
    //   job.stop();
    //   this.schedulerRegistry.deleteCronJob(jobName);
    // }
  }

  // user imap connection list test
  async imapConnectionTest() {
    const imapUserActive = await this.prisma.user.findMany({
      where: {
        email: { isNot: null },
        userSubscriptionPlan: {
          subscriptionPlanPaymentStatus: {
            paymentStatus: 'PAID',
          },
          expiredAt: { gt: new Date() },
        },
      },
      select: {
        profile: { select: { firstName: true, lastName: true } },
        imapConfigurations: true,
      },
    });

    const redisDataSet = {
      user_Name: `${imapUserActive[0].profile?.firstName} ${imapUserActive[0].profile?.lastName}`,
      email: imapUserActive[0].imapConfigurations?.username,
      status: imapUserActive[0].imapConfigurations?.connect
        ? 'Connected'
        : 'Not Connected',
      lastSync: null,
      importedToday: `${0} ${imapUserActive[0].imapConfigurations?.connect ? 'Active' : ''}`,
      error: null,
    };

    return redisDataSet;
  }

  // Test IMAP Connection
  async testConnection(clint: ImapClient, response: Response) {
    try {
      const connection = await this.imapClient(clint);
      await connection.openBox('INBOX');
      connection.end();

      response
        .send(
          cResponseData({
            message: 'IMAP connection successful!',
            data: 'IMAP Test successful',
          }),
        )
        .status(200);
    } catch (err) {
      response
        .send(
          cResponseData({
            message: 'IMAP connection failed',
            error: err.responseText,
          }),
        )
        .status(500);
    }
    return;
  }
  private extractInvoiceData(
    body: string,
    from: string,
    attachments: string[],
  ): TransactionRow | null {
    const getValue = (label: string) => {
      const match = body.match(new RegExp(`${label}:\\s*(.*)`));
      return match ? match[1].trim() : '';
    };

    const invoiceId = getValue('Invoice ID') || getValue('Transaction ID');
    if (!invoiceId) return null;

    const amountStr = getValue('Amount')
      .replace(/[^\d.,]/g, '')
      .replace(',', '.');
    const amount = parseFloat(amountStr) || 0;
    const currency = getValue('Amount').includes('€') ? 'EUR' : 'SEK';

    return {
      date: getValue('Transaction Date') || new Date().toISOString(),
      description: invoiceId,
      category: getValue('Transaction Type') || 'Not categorized',
      amount,
      currency,
      status: 'UNMATCHED',
      linkedInvoiceId: invoiceId,
      attachments,
      from,
    };
  }

  // Read email transactions
  async readEmailTransactions(): Promise<TransactionRow[]> {
    try {
      const connection = await this.imapClient({
        host: process.env.MAIL_HOST || 'imap.gmail.com',
        port: parseInt(process.env.MAIL_PORT || '993'),
        username: process.env.MAIL_USER!,
        password: process.env.MAIL_PASS!,
      });

      await connection.openBox('INBOX');

      const searchCriterias = [
        ['SUBJECT', 'invoice'],
        ['SUBJECT', 'transaction'],
        ['BODY', 'Transaction ID'],
      ];

      const allTransactions: TransactionRow[] = [];

      for (const criteria of searchCriterias) {
        const messages = await connection.search([criteria], {
          bodies: '',
          markSeen: false,
        });

        for (const message of messages) {
          const parsed = await simpleParser(message.parts[0].body);
          const body = parsed.text || parsed.html || '';

          const attachments: string[] =
            parsed.attachments
              ?.map((att) => att.filename)
              .filter((f): f is string => !!f) || [];

          const transaction = this.extractInvoiceData(
            body,
            parsed.from?.text || 'Unknown',
            attachments,
          );
          if (transaction) allTransactions.push(transaction);
        }
      }

      connection.end();
      return allTransactions;
      // amazonq-ignore-next-line
    } catch (err: any) {
      console.error('Failed to read email transactions:', err.message);
      throw new Error(err.message);
    }
  }

  // Match Tink + email transactions
  matchTransactions(
    tinkRows: TransactionRow[],
    emailRows: TransactionRow[],
  ): TransactionRow[] {
    for (const t of tinkRows) {
      for (const e of emailRows) {
        if (
          t.currency === e.currency &&
          Math.abs(t.amount - e.amount) < 1 &&
          Math.abs(new Date(t.date).getTime() - new Date(e.date).getTime()) <=
          2 * 24 * 60 * 60 * 1000
        ) {
          t.status = 'MATCHED';
          t.linkedInvoiceId = e.linkedInvoiceId;
          e.status = 'MATCHED';
        }
      }
    }
    return [...tinkRows, ...emailRows].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }
}
