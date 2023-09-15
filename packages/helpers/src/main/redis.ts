import { OPTIONS, REDIS_URI } from '@config';
import { logger } from '@utils/logger';
import { createClient } from 'redis';

class Redis {
  client() {
    const client = createClient({ url: REDIS_URI });

    client.on('error', (err) => logger.error(['Redis Client Error', err]));
    client.connect().then();
    return client;
  }
}

export default OPTIONS.USE_REDIS ? new Redis().client() : null;
