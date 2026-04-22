import IORedis from 'ioredis';
import { environment } from './environment';

export function createRedisConnection(connectionName: string): IORedis {
  return new IORedis({
    host: environment.redis.host,
    port: environment.redis.port,
    connectionName,
  });
}
