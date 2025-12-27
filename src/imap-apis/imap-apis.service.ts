import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ImapFlow } from 'imapflow';
import { SchedulerRegistry } from '@nestjs/schedule';
// import { CreateImapApiDto } from './dto/create-imap-api.dto';
import { PrismaService } from 'src/config/database/prisma.service';
import { ImapClient } from './types/imapService.type';
import { cResponseData } from 'src/common/cResponse';
import { Response } from 'express';

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

  async readEmailByAccountTest(email: string) {
    // Create IMAP Flow client for each email
    // const account = await this.prisma.emailAccount.findUnique({
    //   where: { email },
    // });

    const client = new ImapFlow({
      host: 'imap.gmail.com',
      port: 993,
      auth: {
        user: '',
        pass: '',
      },
    });

    await client.connect();

    const inbox = await client.getMailboxLock('INBOX');
    try {
      for await (const msg of client.fetch('1:*', { envelope: true })) {
        // console.log(`[${email}] → ${msg.envelope.subject}`);
      }
    } finally {
      inbox.release();
      await client.logout();
    }
  }
}
