import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { MongoMemoryServer } from 'mongodb-memory-server';

const port = Number(process.env.DB_PORT ?? 27017);
const dbPath = fileURLToPath(new URL('../.data', import.meta.url));
await mkdir(dbPath, { recursive: true });

const server = await MongoMemoryServer.create({
  instance: { port, dbPath, storageEngine: 'wiredTiger' },
});

process.stdout.write(`MongoDB running at ${server.getUri()}\n`);

async function stop() {
  await server.stop({ doCleanup: false });
  process.exit(0);
}

process.on('SIGINT', stop);
process.on('SIGTERM', stop);
