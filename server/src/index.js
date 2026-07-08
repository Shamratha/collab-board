import http from 'http';
import { Server as SocketServer } from 'socket.io';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { createApp } from './app.js';

// Dev convenience: if no MONGO_URI is configured (and we're not in production),
// spin up an in-memory MongoDB so `npm run dev` just works with zero setup.
async function resolveMongoUri() {
  if (env.mongoUri) return env.mongoUri;
  if (env.nodeEnv === 'production') {
    throw new Error('MONGO_URI is required in production');
  }
  const { MongoMemoryServer } = await import('mongodb-memory-server');
  const mem = await MongoMemoryServer.create();
  // eslint-disable-next-line no-console
  console.log('No MONGO_URI set — using an in-memory MongoDB (data is not persisted)');
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
