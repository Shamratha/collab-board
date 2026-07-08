import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import authRoutes from './routes/auth.js';
import boardRoutes from './routes/boards.js';
import listRoutes from './routes/lists.js';
import cardRoutes from './routes/cards.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// The Vite build output, served by this same server in production.
const clientDist = path.resolve(__dirname, '../../client/dist');

// Builds the Express app WITHOUT starting a listener, so tests (supertest)
// and the real server bootstrap can both reuse it.
export function createApp() {
  const app = express();

  // CORS is locked to the configured client origin, and `credentials: true`
  // lets the browser send/receive the httpOnly auth cookie cross-origin.
  app.use(cors({ origin: env.clientOrigin, credentials: true }));
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));

  app.use('/api/auth', authRoutes);
  app.use('/api/boards', boardRoutes);
  app.use('/api/lists', listRoutes);
  app.use('/api/cards', cardRoutes);

  // In production, serve the built React app from this same origin so the
  // httpOnly auth cookie and Socket.io connection are first-party (no CORS).
  if (env.nodeEnv === 'production') {
    app.use(express.static(clientDist));
    // SPA fallback — non-API GETs return index.html so client-side routes work.
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api') || req.path === '/health') return next();
      res.sendFile(path.join(clientDist, 'index.html'));
    });
  }

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
