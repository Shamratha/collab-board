import mongoose from 'mongoose';
import { env } from './env.js';

mongoose.set('strictQuery', true);

export async function connectDB(uri = env.mongoUri) {
  if (!uri) throw new Error('connectDB: no Mongo URI provided');
  await mongoose.connect(uri);
  // eslint-disable-next-line no-console
  console.log('MongoDB connected');
  return mongoose.connection;
}

export async function disconnectDB() {
  await mongoose.disconnect();
}
