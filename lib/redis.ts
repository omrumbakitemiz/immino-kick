// lib/redis.ts
import { createClient, RedisClientType } from 'redis';

let redisClient: RedisClientType | null = null;

export async function getRedisClient(): Promise<RedisClientType> {
  if (!redisClient) {
    redisClient = createClient({ url: process.env.REDIS_URL });
    redisClient.on('error', (err) => console.error('Redis Client Error', err));
    await redisClient.connect();
  } else if (!redisClient.isOpen) {
    // If the client exists but isn't open, connect it
    await redisClient.connect();
  }
  return redisClient;
}
