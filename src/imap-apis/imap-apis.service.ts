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
  private clients: { email: string; client: ImapFlow }[] = [];
  private accountInfo = [
    {
      host: 'imap.gmail.com',
      port: 993,
      auth: {
        user: 'srka780@gmail.com',
        pass: 'vaii npas yrac xxwx',
      },
    },
    {
      host: 'imap.gmail.com',
      port: 993,
      auth: {
        user: 'uforcode123@gmail.com',
        // pass: 'tlmz fmoy wzhf csu',
        pass: 'tlmz fmoy wzhf csug',
      },
    },
  ];
  async onModuleInit() {
    for (const account of this.accountInfo) {
      const client = new ImapFlow(account);
      try {
        await client.connect();
        // console.log(
        //   '==================================\n',
        //   client,
        //   '\n=====================================',
        // );
        this.clients.push({ email: account.auth.user, client });
      } catch (error) {
        console.error(`Failed to connect to ${account.auth.user}:`, error);
      }
    }
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
      !a.date || !b.date ? 0 : a.date > b.date ? 1 : -1,
    );
  }
  // Read from all accounts
  async readAllAccounts() {
    const result: { account: string; emails: number }[] = [];
    for (const acc of this.clients) {
      const emails = await this.readAll(acc.client);
      result.push({ account: acc.email, emails: emails.length });
    }
    return result;
  }
}
