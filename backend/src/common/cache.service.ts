import { Injectable, Inject, Logger } from '@nestjs/common';
import Redis from 'ioredis';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

@Injectable()
export class CacheService {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly defaultTtlMs = 5 * 60 * 1000; // 5 minutes
  private readonly logger = new Logger(CacheService.name);

  constructor(
    @Inject('REDIS_CLIENT') private readonly redisClient: Redis | null,
  ) {}

  async get<T>(key: string): Promise<T | null> {
    if (this.redisClient?.status === 'ready') {
      try {
        const raw = await this.redisClient.get(key);
        if (raw === null) return null;
        return JSON.parse(raw) as T;
      } catch (err) {
        this.logger.warn(`Redis GET failed for key "${key}": ${err.message}`);
      }
    }

    return this.getInMemory<T>(key);
  }

  async set<T>(key: string, value: T, ttlMs?: number): Promise<void> {
    const ttl = ttlMs ?? this.defaultTtlMs;

    if (this.redisClient?.status === 'ready') {
      try {
        const ttlSec = Math.ceil(ttl / 1000);
        await this.redisClient.set(key, JSON.stringify(value), 'EX', ttlSec);
      } catch (err) {
        this.logger.warn(`Redis SET failed for key "${key}": ${err.message}`);
        this.setInMemory(key, value, ttl);
      }
    } else {
      this.setInMemory(key, value, ttl);
    }
  }

  async delete(key: string): Promise<void> {
    if (this.redisClient?.status === 'ready') {
      try {
        await this.redisClient.del(key);
      } catch (err) {
        this.logger.warn(`Redis DEL failed for key "${key}": ${err.message}`);
      }
    }

    this.cache.delete(key);
  }

  async clear(): Promise<void> {
    if (this.redisClient?.status === 'ready') {
      try {
        await this.redisClient.flushdb();
      } catch (err) {
        this.logger.warn(`Redis FLUSHDB failed: ${err.message}`);
      }
    }

    this.cache.clear();
  }

  async ping(): Promise<'connected' | 'disconnected'> {
    if (this.redisClient?.status === 'ready') {
      try {
        const result = await this.redisClient.ping();
        return result === 'PONG' ? 'connected' : 'disconnected';
      } catch {
        return 'disconnected';
      }
    }

    return this.cache.size >= 0 ? 'connected' : 'disconnected';
  }

  private getInMemory<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value as T;
  }

  private setInMemory<T>(key: string, value: T, ttlMs: number): void {
    const expiresAt = Date.now() + ttlMs;
    this.cache.set(key, { value, expiresAt });
  }
}
