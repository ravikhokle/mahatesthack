import type { FastifyPluginAsync } from 'fastify';

import { requireRoles } from '../../plugins/auth-guard.js';
import {
  chapterCreateSchema,
  chapterUpdateSchema,
  subjectCreateSchema,
  subjectUpdateSchema,
  taxonomyCreateSchema,
  taxonomyUpdateSchema,
  topicCreateSchema,
  topicUpdateSchema,
} from './schemas.js';
import { TaxonomyService } from './taxonomy.service.js';

function parseBody<T>(schema: { parse: (data: unknown) => T }, body: unknown): T {
  return schema.parse(body);
}

const staff = requireRoles('content_manager', 'super_admin');

export const taxonomyRoutes: FastifyPluginAsync = async (app) => {
  const service = new TaxonomyService();

  app.get('/categories', { preHandler: staff }, async (_request, reply) => {
    return reply.send({ items: await service.listCategories() });
  });

  app.post('/categories', { preHandler: staff }, async (request, reply) => {
    const body = parseBody(taxonomyCreateSchema, request.body);
    return reply.status(201).send({ item: await service.createCategory(body) });
  });

  app.patch('/categories/:id', { preHandler: staff }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = parseBody(taxonomyUpdateSchema, request.body);
    return reply.send({ item: await service.updateCategory(id, body) });
  });

  app.delete('/categories/:id', { preHandler: staff }, async (request, reply) => {
    const { id } = request.params as { id: string };
    await service.deleteCategory(id);
    return reply.status(204).send();
  });

  app.get('/subjects', { preHandler: staff }, async (request, reply) => {
    const query = request.query as { categoryId?: string };
    return reply.send({ items: await service.listSubjects(query.categoryId) });
  });

  app.post('/subjects', { preHandler: staff }, async (request, reply) => {
    const body = parseBody(subjectCreateSchema, request.body);
    return reply.status(201).send({ item: await service.createSubject(body) });
  });

  app.patch('/subjects/:id', { preHandler: staff }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = parseBody(subjectUpdateSchema, request.body);
    return reply.send({ item: await service.updateSubject(id, body) });
  });

  app.delete('/subjects/:id', { preHandler: staff }, async (request, reply) => {
    const { id } = request.params as { id: string };
    await service.deleteSubject(id);
    return reply.status(204).send();
  });

  app.get('/chapters', { preHandler: staff }, async (request, reply) => {
    const query = request.query as { subjectId?: string };
    return reply.send({ items: await service.listChapters(query.subjectId) });
  });

  app.post('/chapters', { preHandler: staff }, async (request, reply) => {
    const body = parseBody(chapterCreateSchema, request.body);
    return reply.status(201).send({ item: await service.createChapter(body) });
  });

  app.patch('/chapters/:id', { preHandler: staff }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = parseBody(chapterUpdateSchema, request.body);
    return reply.send({ item: await service.updateChapter(id, body) });
  });

  app.delete('/chapters/:id', { preHandler: staff }, async (request, reply) => {
    const { id } = request.params as { id: string };
    await service.deleteChapter(id);
    return reply.status(204).send();
  });

  app.get('/topics', { preHandler: staff }, async (request, reply) => {
    const query = request.query as { chapterId?: string };
    return reply.send({ items: await service.listTopics(query.chapterId) });
  });

  app.post('/topics', { preHandler: staff }, async (request, reply) => {
    const body = parseBody(topicCreateSchema, request.body);
    return reply.status(201).send({ item: await service.createTopic(body) });
  });

  app.patch('/topics/:id', { preHandler: staff }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = parseBody(topicUpdateSchema, request.body);
    return reply.send({ item: await service.updateTopic(id, body) });
  });

  app.delete('/topics/:id', { preHandler: staff }, async (request, reply) => {
    const { id } = request.params as { id: string };
    await service.deleteTopic(id);
    return reply.status(204).send();
  });
};
