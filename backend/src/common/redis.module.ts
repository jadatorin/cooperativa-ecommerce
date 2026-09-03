import { Module, Global, Inject, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Global()
@Module({
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: (configService: ConfigService): Redis | null => {
        const redisUrl = configService.get<string>('REDIS_URL', 'redis://localhost:6379');

        try {
          const client = new Redis(redisUrl, {
            maxRetriesPerRequest: 3,
            retryStrategy(times) {
              if (times > 3) return null;
              return Math.min(times * 200, 2000);
            },
            lazyConnect: true,
          });

          client.on('error', (err) => {
            Logger.warn(`Redis connection error: ${err.message}`, 'RedisModule');
          });

          client.on('connect', () => {
            Logger.log('Redis connected successfully', 'RedisModule');
          });

          client.connect().catch(() => {
            Logger.warn('Redis unavailable, using in-memory fallback', 'RedisModule');
          });

          return client;
        } catch {
          Logger.warn('Redis unavailable at startup, using in-memory fallback', 'RedisModule');
          return null;
        }
      },
      inject: [ConfigService],
    },
  ],
  exports: ['REDIS_CLIENT'],
})
export class RedisModule implements OnModuleDestroy {
  constructor(
    @Inject('REDIS_CLIENT') private readonly redisClient: Redis | null,
  ) {}

  async onModuleDestroy(): Promise<void> {
    if (this.redisClient) {
      try {
        await this.redisClient.quit();
        Logger.log('Redis connection closed', 'RedisModule');
      } catch (err) {
        Logger.warn(`Error closing Redis: ${err.message}`, 'RedisModule');
      }
    }
  }
}
