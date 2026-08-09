import type { FastifyPluginAsync } from 'fastify';

import { authenticate, requireRoles } from '../../plugins/auth-guard.js';
import { AttemptService } from './attempt.service.js';
import { ExamService } from './exam.service.js';
import {
  examCreateSchema,
  examUpdateSchema,
  listExamsQuerySchema,
  syncAnswersSchema,
  testSeriesCreateSchema,
  testSeriesUpdateSchema,
} from './schemas.js';

function parseBody<T>(schema: { parse: (data: unknown) => T }, body: unknown): T {
  return schema.parse(body);
}

const staff = requireRoles('content_manager', 'super_admin');

export const examRoutes: FastifyPluginAsync = async (app) => {
  const exams = new ExamService();
  const attempts = new AttemptService(app);

  app.get('/exams', { preHandler: authenticate }, async (request, reply) => {
    const query = listExamsQuerySchema.parse(request.query);
    const isStaff =
      request.user.role === 'content_manager' || request.user.role === 'super_admin';

    return reply.send({
      items: await exams.list({
        type: query.type,
        status: isStaff ? query.status : 'published',
        testSeriesId: query.testSeriesId,
        publishedOnly: !isStaff,
      }),
    });
  });

  app.get('/exams/:id', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const isStaff =
      request.user.role === 'content_manager' || request.user.role === 'super_admin';
    return reply.send({ item: await exams.getById(id, !isStaff) });
  });

  app.post('/exams', { preHandler: staff }, async (request, reply) => {
    const body = parseBody(examCreateSchema, request.body);
    return reply.status(201).send({ item: await exams.create(body, request.user.sub) });
  });

  app.patch('/exams/:id', { preHandler: staff }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = parseBody(examUpdateSchema, request.body);
    return reply.send({ item: await exams.update(id, body) });
  });

  app.delete('/exams/:id', { preHandler: staff }, async (request, reply) => {
    const { id } = request.params as { id: string };
    await exams.remove(id);
    return reply.status(204).send();
  });

  app.get('/test-series', { preHandler: authenticate }, async (_request, reply) => {
    return reply.send({ items: await exams.listSeries() });
  });

  app.post('/test-series', { preHandler: staff }, async (request, reply) => {
    const body = parseBody(testSeriesCreateSchema, request.body);
    return reply.status(201).send({ item: await exams.createSeries(body, request.user.sub) });
  });

  app.patch('/test-series/:id', { preHandler: staff }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = parseBody(testSeriesUpdateSchema, request.body);
    return reply.send({ item: await exams.updateSeries(id, body) });
  });

  app.delete('/test-series/:id', { preHandler: staff }, async (request, reply) => {
    const { id } = request.params as { id: string };
    await exams.removeSeries(id);
    return reply.status(204).send();
  });

  app.post('/exams/:id/attempts', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const result = await attempts.startAttempt(id, request.user.sub);
    return reply.status(201).send(result);
  });

  app.get('/attempts/mine', { preHandler: authenticate }, async (request, reply) => {
    return reply.send({ items: await attempts.listMine(request.user.sub) });
  });

  app.get('/attempts/:id/package', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };
    return reply.send({ package: await attempts.buildPackage(id, request.user.sub) });
  });

  app.post('/attempts/:id/sync', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = parseBody(syncAnswersSchema, request.body);
    return reply.send(await attempts.sync(id, request.user.sub, body));
  });

  app.post('/attempts/:id/submit', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };
    return reply.send({ attempt: await attempts.submit(id, request.user.sub) });
  });

  app.get('/attempts/:id/result', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };
    return reply.send({ result: await attempts.getResult(id, request.user.sub) });
  });
};
