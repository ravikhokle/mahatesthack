import type { FastifyPluginAsync } from 'fastify';

import { requireRoles } from '../../plugins/auth-guard.js';
import { AdminService } from './admin.service.js';
import {
  blogCreateSchema,
  blogUpdateSchema,
  currentAffairCreateSchema,
  currentAffairUpdateSchema,
  notificationCreateSchema,
  notificationUpdateSchema,
  settingsUpdateSchema,
  usersQuerySchema,
  userUpdateSchema,
} from './schemas.js';

function parseBody<T>(schema: { parse: (data: unknown) => T }, body: unknown): T {
  return schema.parse(body);
}

export const adminRoutes: FastifyPluginAsync = async (app) => {
  const admin = new AdminService(app.redis);
  const staff = requireRoles('content_manager', 'super_admin');
  const superAdmin = requireRoles('super_admin');

  app.get('/dashboard', { preHandler: staff }, async (_request, reply) => {
    return reply.send(await admin.getDashboard());
  });

  app.get('/reports', { preHandler: staff }, async (_request, reply) => {
    return reply.send(await admin.getReports());
  });

  app.get('/users', { preHandler: superAdmin }, async (request, reply) => {
    const query = usersQuerySchema.parse(request.query);
    return reply.send(await admin.listUsers(query));
  });

  app.patch('/users/:id', { preHandler: superAdmin }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = parseBody(userUpdateSchema, request.body);
    return reply.send({ item: await admin.updateUser(request.user.sub, id, body) });
  });

  app.get('/blogs', { preHandler: staff }, async (_request, reply) => {
    return reply.send({ items: await admin.listBlogs() });
  });

  app.post('/blogs', { preHandler: staff }, async (request, reply) => {
    const body = parseBody(blogCreateSchema, request.body);
    return reply.status(201).send({ item: await admin.createBlog(request.user.sub, body) });
  });

  app.patch('/blogs/:id', { preHandler: staff }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = parseBody(blogUpdateSchema, request.body);
    return reply.send({ item: await admin.updateBlog(id, body) });
  });

  app.delete('/blogs/:id', { preHandler: staff }, async (request, reply) => {
    const { id } = request.params as { id: string };
    await admin.deleteBlog(id);
    return reply.status(204).send();
  });

  app.get('/current-affairs', { preHandler: staff }, async (_request, reply) => {
    return reply.send({ items: await admin.listCurrentAffairs() });
  });

  app.post('/current-affairs', { preHandler: staff }, async (request, reply) => {
    const body = parseBody(currentAffairCreateSchema, request.body);
    return reply
      .status(201)
      .send({ item: await admin.createCurrentAffair(request.user.sub, body) });
  });

  app.patch('/current-affairs/:id', { preHandler: staff }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = parseBody(currentAffairUpdateSchema, request.body);
    return reply.send({ item: await admin.updateCurrentAffair(id, body) });
  });

  app.delete('/current-affairs/:id', { preHandler: staff }, async (request, reply) => {
    const { id } = request.params as { id: string };
    await admin.deleteCurrentAffair(id);
    return reply.status(204).send();
  });

  app.get('/notifications', { preHandler: staff }, async (_request, reply) => {
    return reply.send({ items: await admin.listNotifications() });
  });

  app.post('/notifications', { preHandler: staff }, async (request, reply) => {
    const body = parseBody(notificationCreateSchema, request.body);
    return reply
      .status(201)
      .send({ item: await admin.createNotification(request.user.sub, body) });
  });

  app.patch('/notifications/:id', { preHandler: staff }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = parseBody(notificationUpdateSchema, request.body);
    return reply.send({ item: await admin.updateNotification(id, body) });
  });

  app.delete('/notifications/:id', { preHandler: staff }, async (request, reply) => {
    const { id } = request.params as { id: string };
    await admin.deleteNotification(id);
    return reply.status(204).send();
  });

  app.get('/settings', { preHandler: superAdmin }, async (_request, reply) => {
    return reply.send(await admin.getSettings());
  });

  app.patch('/settings', { preHandler: superAdmin }, async (request, reply) => {
    const body = parseBody(settingsUpdateSchema, request.body);
    return reply.send(await admin.updateSettings(body));
  });
};
