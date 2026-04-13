import redis from 'redis';

let client = null;

const initRedis = async () => {
  if (client) return client;

  try {
    const newClient = redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        reconnectStrategy: (retries) => Math.min(retries * 50, 500),
      },
    });

    newClient.on('error', (err) => console.log('Redis Client Error', err));
    newClient.on('connect', () => console.log('✓ Redis connected'));

    await newClient.connect();
    client = newClient;
    return client;
  } catch (error) {
    console.warn('⚠ Redis connection failed (optional):', error.message);
    return null;
  }
};

export const getRedisClient = () => client;
export default initRedis;
