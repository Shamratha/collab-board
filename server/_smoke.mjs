// Throwaway: boot the app in PRODUCTION mode against an in-memory Mongo to
// verify static client serving + API both work before deploying.
process.env.NODE_ENV = 'production';
process.env.JWT_SECRET = 'smoke-secret';

const { MongoMemoryServer } = await import('mongodb-memory-server');
const mem = await MongoMemoryServer.create();
process.env.MONGO_URI = mem.getUri();

const mongoose = (await import('mongoose')).default;
await mongoose.connect(process.env.MONGO_URI);

const { createApp } = await import('./src/app.js');
const app = createApp();
app.listen(4100, () => console.log('PROD_SMOKE_UP'));
