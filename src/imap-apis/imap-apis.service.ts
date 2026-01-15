/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import * as imaps from 'imap-simple';
import { simpleParser } from 'mailparser';
// import { CreateImapApiDto } from './dto/create-imap-api.dto';
import { PrismaService } from 'src/config/database/prisma.service';
import { cResponseData } from 'src/common/cResponse';
import { Response } from 'express';
import axios from 'axios';
import * as FormData from 'form-data';

import { Invoice } from 'prisma/generated/prisma/client';
import { ExtractedInvoicePayload } from './dto/extracted-invoice.dto';

const INVOICE_SUBJECT_KEYWORDS = [
  'invoice',
  'factuur',
  'kpn',
  'KPN',
  'rekening',
  'payment',
  'billing',
];

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
  ) {}

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

  private looksLikeInvoice(subject?: string): boolean {
    if (!subject) return false;
    return /invoice|factuur|rechnung|receipt|billing/i.test(subject);
  }

  private toNumber(val: any): number {
    if (val === null || val === undefined) return 0;
    if (typeof val === 'number') return val;

    return (
      Number(
        String(val)
          .replace(/\s/g, '')
          .replace(',', '.')
          .replace(/[^\d.]/g, ''),
      ) || 0
    );
  }

  private parseEuropeanDate(dateStr?: string | null): Date | null {
    if (!dateStr) return null;

    const cleaned = dateStr.replace(/[./]/g, '-').replace(/\s+/g, ' ').trim();

    const match = cleaned.match(
      /^(\d{2})-(\d{2})-(\d{4})(?:\s+(\d{2}):(\d{2})(?::(\d{2}))?)?$/,
    );

    if (!match) return null;

    const [, dd, mm, yyyy, hh = '00', min = '00', ss = '00'] = match;

    return new Date(
      Number(yyyy),
      Number(mm) - 1,
      Number(dd),
      Number(hh),
      Number(min),
      Number(ss),
    );
  }

  // Read email transactions since a specific date
  async readEmailTransactionsSince(
    userId: string,
    sinceDate: Date,
  ): Promise<Invoice[]> {
    try {
      if (!userId) {
        throw new HttpException('User ID is required', HttpStatus.BAD_REQUEST);
      }

      if (!sinceDate) {
        throw new HttpException(
          'Since date is required',
          HttpStatus.BAD_REQUEST,
        );
      }

      const user = await this.prisma.user.findFirst({
        where: {
          id: userId,
          userSubscriptionPlan: {
            subscriptionPlanPaymentStatus: {
              paymentStatus: 'PAID',
            },
            expiredAt: { gt: new Date() },
          },
        },
      });

      if (!user) {
        throw new HttpException(
          'User not found or expired subscription',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Check invoice limit
      const subscription = await this.prisma.userSubscriptionPlan.findFirst({
        where: { UserId: userId, isActive: true },
      });

      if (subscription && subscription.isLimitedInvoicePerMonth) {
        const currentMonth = new Date();
        const startOfMonth = new Date(
          currentMonth.getFullYear(),
          currentMonth.getMonth(),
          1,
        );
        const endOfMonth = new Date(
          currentMonth.getFullYear(),
          currentMonth.getMonth() + 1,
          0,
        );

        const invoiceCount = await this.prisma.invoice.count({
          where: {
            userId,
            createdAt: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
          },
        });

        if (invoiceCount >= subscription.perMonthInvoiceCount) {
          throw new HttpException(
            `Monthly invoice limit reached (${subscription.perMonthInvoiceCount}). Upgrade your plan.`,
            HttpStatus.FORBIDDEN,
          );
        }
      }

      const imapConfig = await this.prisma.imapConfiguration.findFirst({
        where: { userId },
      });
      if (!imapConfig) return [];

      const connection = await this.imapClient({
        host: imapConfig.host || 'imap.gmail.com',
        port: Number(process.env.MAIL_PORT || 993),
        username: imapConfig.username,
        password: imapConfig.password,
      });

      await connection.openBox('INBOX');

      const createdInvoices: Invoice[] = [];

      for (const keyword of INVOICE_SUBJECT_KEYWORDS) {
        const messages = await connection.search(
          [
            ['SUBJECT', keyword],
            ['SINCE', sinceDate.toISOString().split('T')[0]],
          ],
          { bodies: '', markSeen: false },
        );

        for (const msg of messages) {
          const parsed = await simpleParser(msg.parts[0].body);

          const from = parsed.from?.value?.[0]?.address?.toLowerCase() || '';

          // Skip emails older than since date
          if (parsed.date && parsed.date < sinceDate) continue;

          const emailId = `${from}-${parsed.subject}-${parsed.date?.toISOString()}`;

          // Check if already processed
          const exists = await this.prisma.invoice.findFirst({
            where: { additionalNote: { contains: emailId } },
          });
          if (exists) continue;

          const pdfAttachments =
            parsed.attachments?.filter((a) =>
              a.filename?.toLowerCase().endsWith('.pdf'),
            ) || [];

          let invoiceCreated = false;

          // Process PDF attachments
          for (const pdf of pdfAttachments) {
            const form = new FormData();
            form.append('userID', userId);
            form.append('file', pdf.content, {
              filename: pdf.filename,
              contentType: pdf.contentType || 'application/pdf',
            });

            try {
              const { data } = await axios.post(
                'https://pdf-extractor-gsoh.onrender.com/extract',
                form,
                {
                  headers: form.getHeaders(),
                  timeout: 100_000,
                },
              );

              if (!data?.invoice) continue;

              const created = await this.createInvoiceFromExtractedData({
                userID: userId,
                invoice: {
                  ...data.invoice,
                  haveAttachment: true,
                  additionalNote: `Email ID: ${emailId}`,
                  vendor: from,
                },
              });

              createdInvoices.push(created);
              invoiceCreated = true;
              break;
            } catch (err) {
              console.error(`PDF extraction failed: ${err}`);
            }
          }

          // Fallback for emails without PDF
          if (!invoiceCreated && this.looksLikeInvoice(parsed.subject)) {
            const fallbackInvoice = {
              invoiceNo: `EMAIL-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
              issueDate: new Date().toISOString(),
              type: 'BUSINESS' as const,
              currency: 'EUR',
              companyName: from.split('@')[1] || 'Unknown',
              email: from,
              vat: 0,
              vatCurrency: 'EUR',
              subTotal: 0,
              subTotalCurrency: 'EUR',
              totalAmount: 0,
              totalAmountCurrency: 'EUR',
              serviceAndItems: [],
              haveAttachment: false,
              additionalNote: `Email ID: ${emailId}`,
              vendor: from,
            };

            const created = await this.createInvoiceFromExtractedData({
              userID: userId,
              invoice: fallbackInvoice,
            });

            createdInvoices.push(created);
          }
        }
      }

      connection.end();
      return createdInvoices;
    } catch (error) {
      console.error(error);
      throw new HttpException(
        'Failed to read email transactions',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Read email transactions (uses config creation date)
  async readEmailTransactions(userId: string): Promise<Invoice[]> {
    if (!userId) {
      throw new HttpException('User ID is required', HttpStatus.BAD_REQUEST);
    }

    const imapConfig = await this.prisma.imapConfiguration.findFirst({
      where: { userId },
    });
    if (!imapConfig) return [];

    return this.readEmailTransactionsSince(userId, imapConfig.created_at);
  }

  // Create invoice from extracted data
  async createInvoiceFromExtractedData(
    payload: ExtractedInvoicePayload,
  ): Promise<Invoice> {
    if (!payload || !payload.userID) {
      throw new HttpException('User ID is required', HttpStatus.BAD_REQUEST);
    }

    if (!payload.invoice) {
      throw new HttpException(
        'Invoice data is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    const { userID, invoice } = payload;

    if (!invoice.invoiceNo) {
      invoice.invoiceNo = `AI-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    }

    const existing = await this.prisma.invoice.findUnique({
      where: { invoiceNo: invoice.invoiceNo },
    });
    if (existing) {
      throw new ConflictException(`Invoice ${invoice.invoiceNo} exists`);
    }

    return this.prisma.invoice.create({
      data: {
        userId: userID,
        invoiceNo: invoice.invoiceNo,
        issueDate: this.parseEuropeanDate(invoice.issueDate) ?? new Date(),
        dueDate: this.parseEuropeanDate(invoice.dueDate),
        type: invoice.type ?? 'BUSINESS',
        companyName: invoice.companyName ?? 'Unknown',
        email: invoice.email ?? '',
        AddressAndContactInfo: invoice.AddressAndContactInfo ?? null,
        projectInformation: invoice.projectInformation ?? null,
        projectDescription: invoice.projectDescription ?? null,
        vat: this.toNumber(invoice.vat),
        subTotal: this.toNumber(invoice.subTotal),
        totalAmount: this.toNumber(invoice.totalAmount),
        isPaid: invoice.isPaid ?? false,
        paidAt: this.parseEuropeanDate(invoice.paidAt),
        additionalNote: invoice.additionalNote ?? null,
        invoiceSource: 'EMAIL',
        haveAttachment: Boolean(invoice.haveAttachment),
        attachmentUrl: invoice.attachmentUrl ?? null,
        serviceAndItems: {
          create:
            invoice.serviceAndItems?.map((item) => ({
              description: item.name,
              qty: item.quantity || 1,
              rate: this.toNumber(item.unitPrice),
              totalAmount: this.toNumber(item.total),
            })) || [],
        },
        vendor: invoice.vendor,
      },
    });
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
