import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
// import { ImapFlow } from 'imapflow';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { CreateImapApiDto } from './dto/create-imap-api.dto';
import { PrismaService } from 'src/config/database/prisma.service';

@Injectable()
export class ImapApisService implements OnModuleInit, OnModuleDestroy {
  constructor(
    private schedulerRegistry: SchedulerRegistry,
    private prisma: PrismaService, // Your DB service
  ) {}

  async onModuleInit() {
    // await this.loadCronJobsFromDB();
    const imapUserActive = await this.prisma.user.findMany({
      where: {
        email: { isNot: null },
        userSubscriptionPlan: {
          subscriptionPlanPaymentStatus: {
            paymentStatus: 'PAID',
          },
          expiredAt: { gt: new Date() },
        },
        imapConfigurations: {
          connect: true, 
          sync: true 
        },
      },
      select: { imapConfigurations: true },
    });
    console.log(JSON.stringify(imapUserActive, null, 2));
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

  getCronJobsKK() {
    const jobs = this.schedulerRegistry.getCronJobs();
    console.log(jobs);

    return JSON.stringify([...jobs.keys()]);
  }

  loadCronJobsFromDB(data: CreateImapApiDto) {
    // const accounts = await this.prisma.emailAccount.findMany();
    // [{email:"user1@gmail.com", timeupdate:5}, ...]

    // const accounts: ({ email: string; timeupdate: number } | null)[] = [
    //   { email: 'uforcode123@gmail.com', timeupdate: 5 },
    //   null,
    // ];

    if (data.email) this.createCronForAccount(data.email, 5);

    return 'Cron jobs loaded from DB';
  }

  createCronForAccount(email: string, minutes: number) {
    const jobName = `cron_${email}`;
    const cronTime = `*/5 * * * * *`; // Every 'minutes' minutes

    this.stopCronForAccount(email); // Stop existing job if any

    const job = new CronJob(cronTime, () => {
      // this.runCronJob(email);
      console.log(`Running cron job for ${email}`);
    });

    //, null, false, null, 'UTC', null, endDate

    this.schedulerRegistry.addCronJob(jobName, job as any);
    job.start();

    console.log(`Cron job ${jobName} created to run every ${minutes} minutes.`);
  }

  stopCronForAccount(email: string) {
    const jobName = `cron_${email}`;

    try {
      const job = this.schedulerRegistry.getCronJob(jobName);
      job.stop();
      this.schedulerRegistry.deleteCronJob(jobName);

      console.log(`Cron job ${jobName} stopped and removed.`);
    } catch {
      console.log(`Cron job ${jobName} not found.`);
    }
  }

  // async readEmailByAccount(email: string) {
  //   // Create IMAP Flow client for each email
  //   const account = await this.prisma.emailAccount.findUnique({
  //     where: { email },
  //   });

  //   const client = new ImapFlow({
  //     host: 'imap.gmail.com',
  //     port: 993,
  //     auth: {
  //       user: account.email,
  //       pass: account.password,
  //     },
  //   });

  //   await client.connect();

  //   const inbox = await client.getMailboxLock('INBOX');
  //   try {
  //     for await (const msg of client.fetch('1:*', { envelope: true })) {
  //       console.log(`[${email}] → ${msg.envelope.subject}`);
  //     }
  //   } finally {
  //     inbox.release();
  //     await client.logout();
  //   }
  // }
}
