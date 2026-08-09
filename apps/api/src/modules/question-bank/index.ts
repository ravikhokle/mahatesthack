import type { FastifyPluginAsync } from 'fastify';
import multipart from '@fastify/multipart';

import { questionRoutes } from './question.routes.js';
import { taxonomyRoutes } from './taxonomy.routes.js';

export const questionBankRoutes: FastifyPluginAsync = async (app) => {
  await app.register(multipart, {
    limits: {
      fileSize: 5 * 1024 * 1024,
      files: 1,
    },
  });

  await app.register(taxonomyRoutes);
  await app.register(questionRoutes);
};
