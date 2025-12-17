import { Injectable } from '@nestjs/common';
// import { ImapFlow } from 'imapflow';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';

// interface EmailData {
//   uid: number;
//   subject?: string;
//   from?: any;
//   date?: Date;
//   seen: boolean;
// }

@Injectable()
export class ImapApisService {
  constructor(
    private schedulerRegistry: SchedulerRegistry,
    // private prisma: PrismaService,       // Your DB service
  ) {}

  // async onModuleInit() {
  //   await this.loadCronJobsFromDB();
  // }

  loadCronJobsFromDB() {
    // const accounts = await this.prisma.emailAccount.findMany();
    // [{email:"user1@gmail.com", timeupdate:5}, ...]

    const accounts: ({ email: string; timeupdate: number } | null)[] = [
      { email: 'uforcode123@gmail.com', timeupdate: 5 },
      null,
    ];

    if (accounts.length > 0 && accounts[0])
      this.createCronForAccount(accounts[0].email, accounts[0].timeupdate);

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
