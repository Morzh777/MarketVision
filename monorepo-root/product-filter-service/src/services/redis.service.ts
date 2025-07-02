import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: RedisClientType;
  private isConnected = false;

  constructor() {
    this.client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });

    this.client.on('error', (err) => {
      this.logger.error('❌ Redis Client Error:', err);
      this.isConnected = false;
    });

    this.client.on('connect', () => {
      this.logger.log('🔗 Redis подключен');
      this.isConnected = true;
    });

    this.client.on('disconnect', () => {
      this.logger.warn('⚠️ Redis отключен');
      this.isConnected = false;
    });
  }

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  async connect(): Promise<void> {
    try {
      if (!this.isConnected) {
        await this.client.connect();
      }
    } catch (error) {
      this.logger.error('❌ Ошибка подключения к Redis:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.isConnected) {
        await this.client.disconnect();
      }
    } catch (error) {
      this.logger.error('❌ Ошибка отключения от Redis:', error);
    }
  }

  async set(key: string, value: string): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Redis не подключен');
    }
    await this.client.set(key, value);
  }

  async setWithTTL(key: string, value: string, ttlSeconds: number): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Redis не подключен');
    }
    await this.client.setEx(key, ttlSeconds, value);
  }

  async get(key: string): Promise<string | null> {
    if (!this.isConnected) {
      throw new Error('Redis не подключен');
    }
    const result = await this.client.get(key);
    return typeof result === 'string' ? result : null;
  }

  async getTTL(key: string): Promise<number> {
    if (!this.isConnected) {
      throw new Error('Redis не подключен');
    }
    return await this.client.ttl(key);
  }

  async delete(key: string): Promise<number> {
    if (!this.isConnected) {
      throw new Error('Redis не подключен');
    }
    return await this.client.del(key);
  }

  async deleteByPattern(pattern: string): Promise<number> {
    if (!this.isConnected) {
      throw new Error('Redis не подключен');
    }

    const keys = await this.client.keys(pattern);
    if (keys.length === 0) {
      return 0;
    }

    return await this.client.del(keys);
  }

  async exists(key: string): Promise<boolean> {
    if (!this.isConnected) {
      throw new Error('Redis не подключен');
    }
    const result = await this.client.exists(key);
    return result === 1;
  }

  async getAllKeys(pattern: string = '*'): Promise<string[]> {
    if (!this.isConnected) {
      throw new Error('Redis не подключен');
    }
    return await this.client.keys(pattern);
  }

  isHealthy(): boolean {
    return this.isConnected;
  }
} 