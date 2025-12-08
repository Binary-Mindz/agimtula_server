import { Injectable, OnModuleInit } from '@nestjs/common';
import { ImapFlow } from 'imapflow';

interface EmailData {
  uid: number;
  subject?: string;
  from?: any;
  date?: Date;
  seen: boolean;
}

@Injectable()
export class ImapApisService implements OnModuleInit {
  private client = new ImapFlow({
    host: 'imap.gmail.com',
    port: 993,
    auth: {
      user: 'uforcode123@gmail.com',
      // pass: 'tlmz fmoy wzhf csu',
      pass: 'tlmz fmoy wzhf csug',
    },
  });
  async onModuleInit() {
    // for (const account of this.accountInfo) {
    try {
      await this.connect(this.client);
    } catch (error) {
      console.error(`Failed to connect to :`, error);
    }
    // }
  }
  async connect(client: ImapFlow) {
    if (!client.usable) {
      await client.connect();
    }
  }
  // 1. Read ALL emails
  async readAll(client: ImapFlow): Promise<EmailData[]> {
    // await this.connect(client);
    const lock = await client.getMailboxLock('INBOX');
    const mails: EmailData[] = [];
    try {
      for await (const msg of client.fetch('1:*', {
        envelope: true,
        flags: true,
        bodyStructure: true,
      })) {
        console.log(`=====================${msg.uid}====================`);
        console.log(msg.envelope);
        console.log(msg.bodyStructure);
        console.log(msg.bodyParts);
        console.log(`=====================${msg.uid}====================`);
        mails.push({
          uid: msg.uid,
          subject: msg.envelope?.subject,
          from: msg.envelope?.from,
          date: msg.envelope?.date,
          seen: msg.flags?.has('\\Seen') ?? false,
        });
        // const { uid, envelope, flags, bodyStructure, id } = msg;
        // mails.push({
        //   uid,
        //   envelope,
        //   flags: flags?.has('\\Seen') ?? false,
        //   // bodyStructure,
        //   id,
        // });
      }
    } finally {
      lock.release();
    }
    return mails.sort((a, b) =>
      !a.date || !b.date ? 0 : a.date > b.date ? -1 : 1,
    );
  }
  // Read from all accounts
  async readAllAccounts() {
    const emails = await this.readAll(this.client);
    return emails;
  }
}

// off site - cron job per account
// import { Injectable, OnModuleInit } from '@nestjs/common';
// import { SchedulerRegistry } from '@nestjs/schedule';
// import { CronJob } from 'cron';
// import { ImapFlow } from 'imapflow';
// import { PrismaService } from 'src/config/database/prisma.service';

// @Injectable()
// export class ImapApisService implements OnModuleInit {
//   constructor(
//     private schedulerRegistry: SchedulerRegistry,
//     private prisma: PrismaService,       // Your DB service
//   ) {}

//   async onModuleInit() {
//     await this.loadCronJobsFromDB();
//   }

//   async loadCronJobsFromDB() {
//     const accounts = await this.prisma.emailAccount.findMany();
//     // [{email:"user1@gmail.com", timeupdate:5}, ...]

//     for (const acc of accounts) {
//       this.createCronForAccount(acc.email, acc.timeupdate);
//     }
//   }

//   createCronForAccount(email: string, minutes: number) {
//     const jobName = `cron_${email}`;

//     // If job already exists, delete it
//     try {
//       this.schedulerRegistry.deleteCronJob(jobName);
//     } catch {}

//     const cron = new CronJob(`*/${minutes} * * * *`, async () => {
//       console.log(`Running cron for: ${email}`);

//       // TODO: fetch emails for this email (multiple clients)
//       await this.readEmailByAccount(email);
//     });

//     this.schedulerRegistry.addCronJob(jobName, cron);
//     cron.start();

//     console.log(`Cron started for ${email} every ${minutes} min`);
//   }

//   async readEmailByAccount(email: string) {
//     // Create IMAP Flow client for each email
//     const account = await this.prisma.emailAccount.findUnique({
//       where: { email },
//     });

//     const client = new ImapFlow({
//       host: 'imap.gmail.com',
//       port: 993,
//       auth: {
//         user: account.email,
//         pass: account.password,
//       },
//     });

//     await client.connect();

//     const inbox = await client.getMailboxLock('INBOX');
//     try {
//       for await (const msg of client.fetch('1:*', { envelope: true })) {
//         console.log(`[${email}] → ${msg.envelope.subject}`);
//       }
//     } finally {
//       inbox.release();
//       await client.logout();
//     }
//   }
// }
