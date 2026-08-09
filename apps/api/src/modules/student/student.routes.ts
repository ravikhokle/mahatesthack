import type { FastifyPluginAsync } from 'fastify';

import { authenticate } from '../../plugins/auth-guard.js';
import {
  bookmarkCreateSchema,
  leaderboardQuerySchema,
  practiceStartSchema,
  practiceSubmitSchema,
} from './schemas.js';
import { StudentService } from './student.service.js';

function parseBody<T>(schema: { parse: (data: unknown) => T }, body: unknown): T {
  return schema.parse(body);
}

export const studentRoutes: FastifyPluginAsync = async (app) => {
  const student = new StudentService(app.redis);

  app.get('/home', { preHandler: authenticate }, async (request, reply) => {
    return reply.send(await student.getHome(request.user.sub));
  });

  app.get('/analytics', { preHandler: authenticate }, async (request, reply) => {
    return reply.send(await student.getAnalytics(request.user.sub));
  });

  app.get('/leaderboards', { preHandler: authenticate }, async (request, reply) => {
    const query = leaderboardQuerySchema.parse(request.query);
    return reply.send(await student.getLeaderboard(query.examId, query.limit));
  });

  app.get('/bookmarks', { preHandler: authenticate }, async (request, reply) => {
    return reply.send({ items: await student.listBookmarks(request.user.sub) });
  });

  app.post('/bookmarks', { preHandler: authenticate }, async (request, reply) => {
    const body = parseBody(bookmarkCreateSchema, request.body);
    return reply.status(201).send({ item: await student.addBookmark(request.user.sub, body) });
  });

  app.delete('/bookmarks/:id', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };
    await student.removeBookmark(request.user.sub, id);
    return reply.status(204).send();
  });

  app.get('/practice/topics', { preHandler: authenticate }, async (_request, reply) => {
    return reply.send({ items: await student.listPracticeTopics() });
  });

  app.post('/practice/sessions', { preHandler: authenticate }, async (request, reply) => {
    const body = parseBody(practiceStartSchema, request.body);
    return reply.status(201).send(await student.startPractice(request.user.sub, body));
  });

  app.post('/practice/sessions/:id/submit', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = parseBody(practiceSubmitSchema, request.body);
    return reply.send(await student.submitPractice(request.user.sub, id, body));
  });
};
