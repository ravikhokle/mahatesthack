import type { FastifyPluginAsync } from 'fastify';

import { requireRoles } from '../../plugins/auth-guard.js';
import {
  bulkImportSchema,
  questionCreateSchema,
  questionListQuerySchema,
  questionUpdateSchema,
} from './schemas.js';
import { QuestionService } from './question.service.js';
import { UploadService } from './upload.service.js';

function parseBody<T>(schema: { parse: (data: unknown) => T }, body: unknown): T {
  return schema.parse(body);
}

const staff = requireRoles('content_manager', 'super_admin');

export const questionRoutes: FastifyPluginAsync = async (app) => {
  const questions = new QuestionService();
  const uploads = new UploadService();

  app.get('/questions', { preHandler: staff }, async (request, reply) => {
    const query = questionListQuerySchema.parse(request.query);
    return reply.send(await questions.list(query));
  });

  app.get('/questions/:id', { preHandler: staff }, async (request, reply) => {
    const { id } = request.params as { id: string };
    return reply.send({ item: await questions.getById(id) });
  });

  app.post('/questions', { preHandler: staff }, async (request, reply) => {
    const body = parseBody(questionCreateSchema, request.body);
    return reply.status(201).send({ item: await questions.create(body, request.user.sub) });
  });

  app.patch('/questions/:id', { preHandler: staff }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = parseBody(questionUpdateSchema, request.body);
    return reply.send({ item: await questions.update(id, body) });
  });

  app.delete('/questions/:id', { preHandler: staff }, async (request, reply) => {
    const { id } = request.params as { id: string };
    await questions.remove(id);
    return reply.status(204).send();
  });

  app.post('/questions/bulk-import', { preHandler: staff }, async (request, reply) => {
    const body = parseBody(bulkImportSchema, request.body);
    return reply.status(201).send(await questions.bulkImport(body, request.user.sub));
  });

  app.post('/uploads', { preHandler: staff }, async (request, reply) => {
    const file = await request.file();
    if (!file) {
      return reply.status(400).send({
        error: { code: 'NO_FILE', message: 'Image file is required' },
      });
    }

    const result = await uploads.saveImage(file);
    return reply.status(201).send(result);
  });
};
