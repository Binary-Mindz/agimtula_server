import { Injectable } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
// import { CreateImapApiDto } from './dto/create-imap-api.dto';
// import { PrismaService } from 'src/config/database/prisma.service';

@Injectable()
export class CronConfigService {
  constructor(
    private schedulerRegistry: SchedulerRegistry,
    // private prisma: PrismaService, // Your DB service
  ) { }

  createCronForAccount(email: string, minutes: number) {
    const jobName = `cron_${email}`;
    const cronTime = `*/5 * * * * *`;

    this.stopCronForAccount(email); //  

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
}
