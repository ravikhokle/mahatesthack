import type { FastifyPluginAsync } from 'fastify';

import { authenticate } from '../../plugins/auth-guard.js';
import {
  forgotPasswordBodySchema,
  loginBodySchema,
  registerBodySchema,
  resetPasswordBodySchema,
  updateProfileBodySchema,
  verifyEmailBodySchema,
} from './auth.schemas.js';
import { AuthService } from './auth.service.js';

function parseBody<T>(schema: { parse: (data: unknown) => T }, body: unknown): T {
  return schema.parse(body);
}

export const authRoutes: FastifyPluginAsync = async (app) => {
  const authService = new AuthService(app);

  app.post('/register', async (request, reply) => {
    const body = parseBody(registerBodySchema, request.body);
    const result = await authService.register(body, reply);
    return reply.status(201).send(result);
  });

  app.post('/login', async (request, reply) => {
    const body = parseBody(loginBodySchema, request.body);
    const result = await authService.login(body, reply);
    return reply.send(result);
  });

  app.post('/refresh', async (request, reply) => {
    const rawCookie = request.cookies.refreshToken;
    const result = await authService.refresh(reply, rawCookie);
    return reply.send(result);
  });

  app.post('/logout', { preHandler: authenticate }, async (request, reply) => {
    await authService.logout(reply, request.user.sub, request.cookies.refreshToken);
    return reply.status(204).send();
  });

  app.post('/forgot-password', async (request, reply) => {
    const body = parseBody(forgotPasswordBodySchema, request.body);
    const result = await authService.forgotPassword(body);
    return reply.send(result);
  });

  app.post('/reset-password', async (request, reply) => {
    const body = parseBody(resetPasswordBodySchema, request.body);
    const result = await authService.resetPassword(body);
    return reply.send(result);
  });

  app.post('/verify-email', async (request, reply) => {
    const body = parseBody(verifyEmailBodySchema, request.body);
    const result = await authService.verifyEmail(body);
    return reply.send(result);
  });

  app.post('/resend-verification', { preHandler: authenticate }, async (request, reply) => {
    const result = await authService.resendVerification(request.user.sub);
    return reply.send(result);
  });

  app.get('/me', { preHandler: authenticate }, async (request, reply) => {
    const user = await authService.getProfile(request.user.sub);
    return reply.send({ user });
  });

  app.patch('/me', { preHandler: authenticate }, async (request, reply) => {
    const body = parseBody(updateProfileBodySchema, request.body);
    const user = await authService.updateProfile(request.user.sub, body);
    return reply.send({ user });
  });
};
