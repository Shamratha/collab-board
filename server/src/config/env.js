import dotenv from 'dotenv';

dotenv.config();

const isProd = process.env.NODE_ENV === 'production';

// Only production hard-requires real config. In dev/test we fall back to an
// in-memory MongoDB (see index.js) and a throwaway JWT secret, so the app runs
// with zero setup.
const required = isProd ? ['MONGO_URI', 'JWT_SECRET'] : [];

const missing = required.filter((key) => !process.env[key]);
if (missing.length > 0) {
  // eslint-disable-next-line no-console
  console.error(`Missing required env vars: ${missing.join(', ')}`);
  process.exit(1);
}

const isTest = process.env.NODE_ENV === 'test';

export const env = {
  port: Number(process.env.PORT) || 4000,
  nodeEnv: process.env.NODE_ENV || 'development',
  isTest,
  mongoUri: process.env.MONGO_URI || '',
  jwtSecret: process.env.JWT_SECRET || 'test-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  // On Render, RENDER_EXTERNAL_URL is injected automatically; since the client
  // is served from the same origin in production, this keeps CORS/cookies correct.
  clientOrigin:
    process.env.CLIENT_ORIGIN ||
    process.env.RENDER_EXTERNAL_URL ||
    'http://localhost:5173',
  // Optional: when set, Socket.io uses a Redis pub/sub adapter so rooms work
  // across multiple server instances (horizontal scaling).
  redisUrl: process.env.REDIS_URL || '',
};
