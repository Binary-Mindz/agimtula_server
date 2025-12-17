import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisServiceService implements OnModuleInit, OnModuleDestroy {
  private redisClient: Redis;

  onModuleInit() {
    this.redisClient = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
    });

    this.redisClient.on('connect', () => {
      console.log('Connected to Redis server');
    });

    this.redisClient.on('error', (err) => {
      console.error('Redis error:', err);
    });
  }

  async onModuleDestroy() {
    await this.redisClient.quit();
    console.log('Disconnected from Redis server');
  }

  getClient(): Redis {
    return this.redisClient;
  }

  async set(key: string, value: string, duration?: number) {
    if (duration) {
      return await this.redisClient.set(key, value, 'EX', duration);
    }
    return await this.redisClient.set(key, value);
  }

  async get(key: string) {
    return await this.redisClient.get(key);
  }

  async del(key: string) {
    return await this.redisClient.del(key);
  }
}
