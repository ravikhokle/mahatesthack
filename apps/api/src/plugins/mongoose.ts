import fp from 'fastify-plugin';
import mongoose from 'mongoose';

import { env } from '../config/env.js';

declare module 'fastify' {
  interface FastifyInstance {
    mongoose: typeof mongoose;
  }
}

export const mongoosePlugin = fp(async (app) => {
  mongoose.set('strictQuery', true);

  try {
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
  } catch (error) {
    app.log.error({ err: error }, 'Failed to connect to MongoDB');
    throw error;
  }

  app.decorate('mongoose', mongoose);

  app.addHook('onClose', async () => {
    await mongoose.connection.close();
  });

  app.log.info('Connected to MongoDB');
});
