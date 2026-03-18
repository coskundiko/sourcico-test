import { Injectable, Inject } from '@nestjs/common';
import type { RedisClientType } from 'redis';

@Injectable()
export class PermissionsCacheService {
  private readonly CACHE_PREFIX = 'user_perms:';
  private readonly TTL = 60 * 60 * 24; // 24 hours

  constructor(
    @Inject('REDIS_CLIENT')
    private readonly redisClient: RedisClientType,
  ) {}

  async getPermissions(userId: number): Promise<string[] | null> {
    const key = `${this.CACHE_PREFIX}${userId}`;
    const data = await this.redisClient.get(key);
    return data ? JSON.parse(data) : null;
  }

  async setPermissions(userId: number, permissions: string[]): Promise<void> {
    const key = `${this.CACHE_PREFIX}${userId}`;
    await this.redisClient.set(key, JSON.stringify(permissions), {
      EX: this.TTL,
    });
  }

  async invalidate(userId: number): Promise<void> {
    const key = `${this.CACHE_PREFIX}${userId}`;
    await this.redisClient.del(key);
  }

  async clearAll(): Promise<void> {
    const keys: string[] = [];
    for await (const batch of this.redisClient.scanIterator({ MATCH: `${this.CACHE_PREFIX}*` })) {
      keys.push(...batch);
    }
    if (keys.length > 0) {
      await this.redisClient.del(keys);
    }
  }
}
