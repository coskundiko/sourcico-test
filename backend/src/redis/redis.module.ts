import { Module, Global, Injectable, Inject, OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from 'redis';
import type { RedisClientType } from 'redis';

@Injectable()
class RedisShutdownService implements OnApplicationShutdown {
  constructor(@Inject('REDIS_CLIENT') private readonly client: RedisClientType) {}

  async onApplicationShutdown() {
    if (this.client.isOpen) {
      await this.client.quit();
    }
  }
}

@Global()
@Module({
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: async (configService: ConfigService) => {
        const client = createClient({
          socket: {
            host: configService.get<string>('REDIS_HOST', 'localhost'),
            port: configService.get<number>('REDIS_PORT', 6379),
          },
        });
        await client.connect();
        return client;
      },
      inject: [ConfigService],
    },
    RedisShutdownService,
  ],
  exports: ['REDIS_CLIENT'],
})
export class RedisModule {}
