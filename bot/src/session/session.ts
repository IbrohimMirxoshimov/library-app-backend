import { session } from 'grammy';
import { RedisAdapter } from '@grammyjs/storage-redis';
import Redis from 'ioredis';
import { getBotConfig } from '../config';
import { SessionData, createInitialSessionData } from './session.interface';
import { CustomContext } from '../context/custom-context';

/**
 * Creates Redis-backed session middleware for grammyJS.
 * Session key is derived from ctx.from.id (Telegram user ID).
 * Data is stored in Redis with a 30-day TTL.
 */
export function createSessionMiddleware() {
  const config = getBotConfig();

  const redisInstance = new Redis({
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password,
  });

  const storage = new RedisAdapter<SessionData>({
    instance: redisInstance,
    ttl: 60 * 60 * 24 * 30, // 30 days in seconds
  });

  return session<SessionData, CustomContext>({
    initial: createInitialSessionData,
    storage,
    getSessionKey: (ctx) => {
      // Use Telegram user ID as session key — works for private chats, inline queries, callbacks
      return ctx.from?.id?.toString();
    },
  });
}
