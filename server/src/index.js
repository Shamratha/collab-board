import http from 'http';
import { Server as SocketServer } from 'socket.io';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { createApp } from './app.js';

async function start() {
  await connectDB();

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
