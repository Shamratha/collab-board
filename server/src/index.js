import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Server as SocketServer } from 'socket.io';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { createApp } from './app.js';
import { registerSockets } from './sockets/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Dev convenience: if no MONGO_URI is configured (and we're not in production),
// run a local MongoDB backed by the mongodb-memory-server binary — but pointed
// at a fixed on-disk dbPath + dbName so data PERSISTS across restarts. This
// gives `npm run dev` a real, durable database with zero setup.
async function resolveMongoUri() {
  if (env.mongoUri) return env.mongoUri;
  if (env.nodeEnv === 'production') {
    throw new Error('MONGO_URI is required in production');
  }
  const { MongoMemoryServer } = await import('mongodb-memory-server');
  const dbPath = path.resolve(__dirname, '../../.data/db');
  fs.mkdirSync(dbPath, { recursive: true });
  const mem = await MongoMemoryServer.create({
    // wiredTiger + a stable dbPath/dbName = the data is written to disk and
    // reloaded on the next start (ephemeral engines would lose it).
    instance: { dbPath, dbName: 'collabboard', storageEngine: 'wiredTiger' },
  });
  // eslint-disable-next-line no-console
  console.log('No MONGO_URI set — using a local persistent MongoDB at .data/db');
  return mem.getUri();
}

async function start() {
  const uri = await resolveMongoUri();
  await connectDB(uri);

  const app = createApp();
  const server = http.createServer(app);

  // Socket.io is wired up now so the server is ready for Phase 2 real-time
  // work; handlers get registered in src/sockets/ then.
  const io = new SocketServer(server, {
    cors: { origin: env.clientOrigin, credentials: true },
  });
  app.set('io', io);
  registerSockets(io);

  server.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`CollabBoard API listening on http://localhost:${env.port}`);
  });
}

start().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start server:', err);
  process.exit(1);
});
