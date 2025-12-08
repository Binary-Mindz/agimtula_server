import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';
import { ENVEnum } from 'src/common/enum/env.enum';
import { PrismaClient } from '../../../prisma/generated/prisma/client';
// import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private readonly prisma: PrismaClient;
  private readonly connectionString: string;

  constructor(private readonly configService: ConfigService) {
    const connectionString = configService.getOrThrow<string>(
      ENVEnum.DATABASE_URL,
    );

    const adapter = new PrismaPg({ connectionString });

    super({
      adapter,
      log: [{ emit: 'event', level: 'error' }],
    });

    this.connectionString = connectionString;

    this.prisma = new PrismaClient({
      adapter,
      log: [{ emit: 'event', level: 'error' }],
    });
  }

  async onModuleInit() {
    this.logger.log('[INIT] Prisma connecting...');
    await this.prisma.$connect();
    this.logger.log('[INIT] Prisma connected');
  }

  async onModuleDestroy() {
    this.logger.log('[DESTROY] Prisma disconnecting...');
    await this.prisma.$disconnect();
    this.logger.log('[DESTROY] Prisma disconnected');
  }

  /** Expose Prisma models (like prisma.user, prisma.post, etc.) */
  get client() {
    return this.prisma;
  }
}
