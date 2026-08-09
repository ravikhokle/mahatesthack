import { mkdir } from 'node:fs/promises';
import path from 'node:path';

import Fastify, { type FastifyInstance } from 'fastify';
import fastifyStatic from '@fastify/static';
import { ZodError } from 'zod';

import { env } from './config/env.js';
import { isAppError } from './lib/errors.js';
import { adminRoutes } from './modules/admin/admin.routes.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { examModuleRoutes } from './modules/exams/index.js';
import { questionBankRoutes } from './modules/question-bank/index.js';
import { studentRoutes } from './modules/student/student.routes.js';
import { websiteRoutes } from './modules/website/website.routes.js';
import { mongoosePlugin } from './plugins/mongoose.js';
import { natsPlugin } from './plugins/nats.js';
import { redisPlugin } from './plugins/redis.js';
import { securityPlugins } from './plugins/security.js';

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === 'production' ? 'info' : 'debug',
    },
  });

  app.setErrorHandler((error, _request, reply) => {
    if (isAppError(error)) {
      return reply.status(error.statusCode).send({
        error: {
          code: error.code,
          message: error.message,
        },
      });
    }

    if (error instanceof ZodError) {
      return reply.status(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request body',
          details: error.flatten(),
        },
      });
    }

    app.log.error(error);
    return reply.status(500).send({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Something went wrong',
      },
    });
  });

  await app.register(securityPlugins);
  await app.register(mongoosePlugin);
  await app.register(redisPlugin);
  await app.register(natsPlugin);

  const uploadsRoot = path.resolve(env.UPLOAD_DIR);
  await mkdir(uploadsRoot, { recursive: true });

  await app.register(fastifyStatic, {
    root: uploadsRoot,
    prefix: '/uploads/',
    decorateReply: false,
  });

  app.get('/health', async () => ({
    status: 'ok',
    service: 'mahatest-api',
    redis: 'connected',
    mongodb: 'connected',
    nats: app.natsConnected ? 'connected' : 'inline-fallback',
    timestamp: new Date().toISOString(),
  }));

  await app.register(authRoutes, { prefix: '/auth' });
  await app.register(questionBankRoutes, { prefix: '/question-bank' });
  await app.register(examModuleRoutes);
  await app.register(studentRoutes, { prefix: '/student' });
  await app.register(adminRoutes, { prefix: '/admin' });
  await app.register(websiteRoutes, { prefix: '/public' });

  return app;
}
