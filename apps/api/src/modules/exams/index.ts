import type { FastifyPluginAsync } from 'fastify';

import { examRoutes } from './exam.routes.js';
import { examWebsocketRoutes } from './exam.ws.js';

export const examModuleRoutes: FastifyPluginAsync = async (app) => {
  await app.register(examRoutes);
  await app.register(examWebsocketRoutes);
};
