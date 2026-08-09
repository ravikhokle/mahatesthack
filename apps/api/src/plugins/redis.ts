import fp from 'fastify-plugin';
import { Redis } from 'ioredis';

import { env } from '../config/env.js';
import type { TokenStore } from '../lib/token-store.js';

declare module 'fastify' {
  interface FastifyInstance {
    redis: Redis;
    tokenStore: TokenStore;
  }
}

function createRedisTokenStore(redis: Redis): TokenStore {
  return {
    async set(key, value, ttlSeconds) {
      if (ttlSeconds > 0) {
        await redis.set(key, value, 'EX', ttlSeconds);
        return;
      }
      await redis.set(key, value);
    },
    async get(key) {
      return redis.get(key);
    },
    async del(...keys) {
      if (keys.length === 0) {
        return 0;
      }
      return redis.del(...keys);
    },
    async keys(pattern) {
      return redis.keys(pattern);
    },
  };
}

export const redisPlugin = fp(async (app) => {
  const redis = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  });

  try {
    await redis.connect();
    await redis.ping();
  } catch (error) {
    redis.disconnect();
    app.log.error(
      { err: error },
      'Failed to connect to Redis. Install and start Redis, then set REDIS_URL (default redis://127.0.0.1:6379).',
    );
    throw error;
  }

  app.decorate('redis', redis);
  app.decorate('tokenStore', createRedisTokenStore(redis));

  app.addHook('onClose', async () => {
    await redis.quit();
  });

  app.log.info('Connected to Redis');
});
