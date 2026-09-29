import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { connectDatabase, disconnectDatabase } from './database/client.js';
import { ensureIndexes } from './database/indexes.js';

await connectDatabase();
await ensureIndexes();

const server = createApp().listen(env.PORT, () => {
  logger.info({ port: env.PORT }, 'API listening');
});

async function shutdown(signal) {
  logger.info({ signal }, 'Shutting down');
  server.close(async () => {
    await disconnectDatabase();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
