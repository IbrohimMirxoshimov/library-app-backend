import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { getConfig } from '../../config';

@Injectable()
export class RedisService extends Redis implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);

  constructor() {
    const config = getConfig();
    super({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      maxRetriesPerRequest: 3,
    });
  }

  async onModuleDestroy() {
    this.logger.log('Disconnecting from Redis...');
    await this.quit();
  }
}
