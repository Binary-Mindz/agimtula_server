import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ImapFlow } from 'imapflow';
import { SchedulerRegistry } from '@nestjs/schedule';
import * as imaps from 'imap-simple';
import { simpleParser } from 'mailparser';
// import { CreateImapApiDto } from './dto/create-imap-api.dto';
import { PrismaService } from 'src/config/database/prisma.service';
import { ImapClient } from './types/imapService.type';
import { cResponseData } from 'src/common/cResponse';
import { Response } from 'express';

interface TransactionInvoice {
  invoiceId: string;
  accountNumber: string;
  transactionDate: string;
  transactionType: string;
  amount: string;
  status: string;
  from: string;
  attachments: string[];
}

@Injectable()
export class ImapApisService implements OnModuleInit, OnModuleDestroy {
  constructor(
    private schedulerRegistry: SchedulerRegistry,
    private prisma: PrismaService, // Your DB service
  ) {}

  private imapClient({ host, port, username, password }: ImapClient): any {
    return new ImapFlow({
      host,
      port,
      auth: {
        user: username,
        pass: password,
      },
      logger: false,
      // socketTimeout: 60000,
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
    //       sync: true
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
      await this.imapClient(clint).connect();
      // console.log('IMAP connection successful!');
      response
        .send(
          cResponseData({
            message: 'IMAP connection successful!',
            data: 'IMAP Test successful',
          }),
        )
        .status(200);
    } catch (err) {
      // console.log('IMAP connection error:', err);
      response
        .send(
          cResponseData({
            message: 'IMAP connection failed',
            error: err.responseText,
          }),
        )
        .status(500);
    } finally {
      this.imapClient(clint).disconnect();
    }
    return;
  }

  extractInvoiceData(
    body: string,
    from: string,
    attachments: string[],
  ): TransactionInvoice | null {
    const getValue = (label: string) => {
      const match = body.match(new RegExp(`${label}:\\s*(.*)`));
      return match ? match[1].trim() : '';
    };

    const invoiceId = getValue('Invoice ID') || getValue('Transaction ID');

    if (!invoiceId) return null;

    return {
      invoiceId,
      accountNumber: getValue('Account Number'),
      transactionDate: getValue('Transaction Date'),
      transactionType: getValue('Transaction Type'),
      amount: getValue('Amount'),
      status: getValue('Status'),
      from,
      attachments, // 👈 attach filenames here
    };
  }

  async readEmailByAccountTest(): Promise<{
    count: number;
    invoices: TransactionInvoice[];
  }> {
    try {
      const config = {
        imap: {
          user: process.env.MAIL_USER!,
          password: process.env.MAIL_PASS!,
          host: 'imap.gmail.com',
          port: 993,
          tls: true,
          authTimeout: 10000,
          tlsOptions: { rejectUnauthorized: false },
        },
      };

      const connection = await imaps.connect(config);
      await connection.openBox('INBOX');

      const searchCriterias = [
        ['SUBJECT', 'invoice'],
        ['SUBJECT', 'transaction'],
        ['SUBJECT', 'salary'],
        ['BODY', 'Transaction ID'],
      ];

      const allInvoices: TransactionInvoice[] = [];

      for (const criteria of searchCriterias) {
        const messages = await connection.search([criteria], {
          bodies: '',
          markSeen: false,
        });

        for (const message of messages) {
          const parsed = await simpleParser(message.parts[0].body);

          const body = parsed.text || parsed.html || '';

          // 🔹 Extract attachment file names only
          const attachmentNames =
            parsed.attachments
              // eslint-disable-next-line @typescript-eslint/no-unsafe-return
              ?.map((att) => att.filename)
              .filter((filename): filename is string => Boolean(filename)) ||
            [];

          const invoice = this.extractInvoiceData(
            body as string,
            (parsed.from?.text as string) || 'Unknown',
            attachmentNames as string[],
          );

          if (invoice) {
            allInvoices.push(invoice);
          }
        }
      }

      connection.end();

      return {
        count: allInvoices.length,
        invoices: allInvoices,
      };
    } catch (error: any) {
      console.error('Email read failed:', error.message);
      throw new Error(`Email read failed: ${error.message}`);
    }
  }
}
