import type { FastifyPluginAsync } from 'fastify';

import { contactCreateSchema } from './schemas.js';
import { WebsiteService } from './website.service.js';

export const websiteRoutes: FastifyPluginAsync = async (app) => {
  const website = new WebsiteService();

  app.get('/blogs', async (_request, reply) => {
    return reply.send({ items: await website.listPublishedBlogs() });
  });

  app.get('/blogs/:slug', async (request, reply) => {
    const { slug } = request.params as { slug: string };
    return reply.send({ item: await website.getPublishedBlogBySlug(slug) });
  });

  app.get('/current-affairs', async (_request, reply) => {
    return reply.send({ items: await website.listPublishedCurrentAffairs() });
  });

  app.get('/current-affairs/:slug', async (request, reply) => {
    const { slug } = request.params as { slug: string };
    return reply.send({ item: await website.getPublishedCurrentAffairBySlug(slug) });
  });

  app.get('/settings', async (_request, reply) => {
    return reply.send(await website.getPublicSettings());
  });

  app.post('/contact', async (request, reply) => {
    const body = contactCreateSchema.parse(request.body);
    return reply.status(201).send(await website.submitContact(body));
  });
};
