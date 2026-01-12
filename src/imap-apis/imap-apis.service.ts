/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  ConflictException,
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

const INVOICE_SENDERS = [
  'odido.nl',
  'kpn.com',
  'vodafone.com',
  'vodafone.nl',
  'makro.nl',
  'ridoy.babu.781@gmail.com',
  'sligro.nl',
];

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
  // private extractInvoiceData(
  //   body: string,
  //   from: string,
  //   attachments: string[],
  // ): TransactionRow | null {
  //   const getValue = (label: string) => {
  //     const match = body.match(new RegExp(`${label}:\\s*(.*)`));
  //     return match ? match[1].trim() : '';
  //   };

  //   const invoiceId = getValue('Invoice ID') || getValue('Transaction ID');
  //   if (!invoiceId) return null;

  //   const amountStr = getValue('Amount')
  //     .replace(/[^\d.,]/g, '')
  //     .replace(',', '.');
  //   const amount = parseFloat(amountStr) || 0;
  //   const currency = getValue('Amount').includes('€') ? 'EUR' : 'SEK';

  //   return {
  //     date: getValue('Transaction Date') || new Date().toISOString(),
  //     description: invoiceId,
  //     category: getValue('Transaction Type') || 'Not categorized',
  //     amount,
  //     currency,
  //     status: 'UNMATCHED',
  //     linkedInvoiceId: invoiceId,
  //     attachments,
  //     from,
  //   };
  // }

  // Read email transactions
  async readEmailTransactions(userId: string): Promise<Invoice[]> {
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

    const allTransactions: Invoice[] = [];

    for (const domain of INVOICE_SENDERS) {
      for (const keyword of INVOICE_SUBJECT_KEYWORDS) {
        const messages = await connection.search(
          [
            ['FROM', domain],
            ['SUBJECT', keyword],
          ],
          { bodies: '', markSeen: false },
        );

        for (const message of messages) {
          const parsed = await simpleParser(message.parts[0].body);
          const fromAddress =
            parsed.from?.value?.[0]?.address?.toLowerCase() || '';
          if (!fromAddress.includes(domain)) continue;

          const hasAttachments = parsed.attachments?.length > 0;
          let invoiceCreated = false;

          if (hasAttachments) {
            for (const attachment of parsed.attachments) {
              if (!attachment.filename?.toLowerCase().endsWith('.pdf')) continue;

              const formData = new FormData();
              formData.append('userID', userId);
              formData.append('file', attachment.content, {
                filename: attachment.filename,
                contentType: attachment.contentType || 'application/pdf',
              });

              try {
                console.log(
                  `Attempting PDF extraction for: ${attachment.filename}`,
                );
                console.log(`File size: ${attachment.content.length} bytes`);

                const { data } = await axios.post(
                  'https://pdf-extractor-gsoh.onrender.com/extract',
                  formData,
                  {
                    headers: formData.getHeaders(),
                    timeout: 60_000,
                    maxContentLength: 50 * 1024 * 1024, // 50MB
                  },
                );

                console.log('PDF extraction response:', data);

                if (data?.invoice) {
                  const created = await this.createInvoiceFromExtractedData({
                    userID: userId,
                    invoice: { ...data.invoice, haveAttachment: true },
                  });
                  allTransactions.push(created);
                  console.log(
                    `Successfully created invoice: ${data.invoice.invoiceNo}`,
                  );
                  invoiceCreated = true;
                }
              } catch (apiErr: any) {
                console.error(
                  `PDF extraction failed for ${attachment.filename}:`,
                  {
                    message: apiErr.message,
                    status: apiErr.response?.status,
                    statusText: apiErr.response?.statusText,
                    data: JSON.stringify(apiErr.response?.data, null, 2),
                    code: apiErr.code,
                  },
                );
              }
            }
          }

          // Create invoice without attachment if no PDF was processed
          if (!invoiceCreated) {
            try {
              const fallbackInvoice = {
                invoiceNo: `EMAIL-${Date.now()}`,
                companyName: fromAddress.split('@')[1] || 'Unknown',
                email: fromAddress,
                issueDate: new Date().toISOString(),
                type: 'BUSINESS' as const,
                currency: 'EUR',
                vatCurrency: 'EUR',
                subTotalCurrency: 'EUR',
                totalAmountCurrency: 'EUR',
                totalAmount: 0,
                subTotal: 0,
                vat: 0,
                serviceAndItems: [{
                  name: parsed.subject || 'Email Invoice',
                  quantity: 1,
                  unitPrice: 0,
                  unitPriceCurrency: 'EUR',
                  total: 0,
                  totalCurrency: 'EUR'
                }],
                haveAttachment: false
              };

              const created = await this.createInvoiceFromExtractedData({
                userID: userId,
                invoice: fallbackInvoice,
              });
              allTransactions.push(created);
              console.log(`Created invoice without attachment: ${fallbackInvoice.invoiceNo}`);
            } catch (fallbackErr) {
              console.error('Failed to create fallback invoice:', fallbackErr);
            }
          }
        }
      }
    }

    connection.end();
    return allTransactions;
  }

  private parseEuropeanDate(dateStr?: string | null): Date | null {
    if (!dateStr) return null;

    // Normalize separators
    const normalized = dateStr.replace(/[./]/g, '-');

    // Match: DD-MM-YYYY HH:mm(:ss)?
    const match = normalized.match(
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

  // --- Core: Store invoice in DB ---
  async createInvoiceFromExtractedData(
    payload: ExtractedInvoicePayload,
  ): Promise<Invoice> {
    const { userID, invoice } = payload;

    // ✅ Guard 1: invoice number
    if (!invoice?.invoiceNo) {
      throw new ConflictException('Invoice number missing – skipping this PDF');
    }

    const existing = await this.prisma.invoice.findUnique({
      where: { invoiceNo: invoice.invoiceNo },
    });

    if (existing) {
      throw new ConflictException(`Invoice ${invoice.invoiceNo} exists`);
    }

    return this.prisma.$transaction(async (tx) => {
      return tx.invoice.create({
        data: {
          userId: userID,
          invoiceNo: invoice.invoiceNo,

          issueDate: this.parseEuropeanDate(invoice.issueDate) ?? new Date(),

          dueDate: this.parseEuropeanDate(invoice.dueDate),

          type: invoice.type ?? 'BUSINESS',

          companyName: invoice.companyName ?? 'Unknown Supplier',
          email: invoice.email ?? '',

          AddressAndContactInfo: invoice.AddressAndContactInfo ?? null,
          projectInformation: invoice.projectInformation ?? null,
          projectDescription: invoice.projectDescription ?? null,

          vat: Number(invoice.vat) || 0,
          subTotal: Number(invoice.subTotal) || 0,
          totalAmount: Number(invoice.totalAmount) || 0,

          isPaid: invoice.isPaid ?? false,
          paidAt: this.parseEuropeanDate(invoice.paidAt),

          additionalNote: invoice.additionalNote ?? null,

          invoiceSource: 'EMAIL',
          haveAttachment: Boolean(invoice.haveAttachment),
          attachmentUrl: invoice.attachmentUrl ?? null,

          serviceAndItems: {
            create: invoice.serviceAndItems.map((item) => ({
              description: item.name,
              qty: item.quantity || 1,
              rate: Number(item.unitPrice),
              totalAmount: Number(item.total),
            })),
          },
        },
      });
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
