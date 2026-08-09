import type { FastifyPluginAsync } from 'fastify';
import websocket from '@fastify/websocket';

import { AppError } from '../../lib/errors.js';
import type { AccessTokenPayload } from '../../plugins/security.js';
import { AttemptService } from './attempt.service.js';
import { syncAnswersSchema } from './schemas.js';

type ClientMessage =
  | { type: 'sync'; payload: unknown }
  | { type: 'heartbeat' }
  | { type: 'subscribe'; attemptId: string };

export const examWebsocketRoutes: FastifyPluginAsync = async (app) => {
  await app.register(websocket);

  const attempts = new AttemptService(app);

  app.get(
    '/exams/ws',
    { websocket: true },
    (socket, request) => {
      const token =
        typeof request.query === 'object' &&
        request.query !== null &&
        'token' in request.query &&
        typeof (request.query as { token?: unknown }).token === 'string'
          ? (request.query as { token: string }).token
          : null;

      let userId: string | null = null;

      void (async () => {
        try {
          if (!token) {
            throw new AppError('Missing token', 401, 'UNAUTHORIZED');
          }
          const payload = app.jwt.verify<AccessTokenPayload>(token);
          if (payload.type !== 'access') {
            throw new AppError('Invalid token', 401, 'UNAUTHORIZED');
          }
          userId = payload.sub;
          socket.send(JSON.stringify({ type: 'ready' }));
        } catch {
          socket.send(JSON.stringify({ type: 'error', message: 'Unauthorized' }));
          socket.close();
        }
      })();

      socket.on('message', (raw: Buffer | ArrayBuffer | Buffer[]) => {
        void (async () => {
          if (!userId) {
            return;
          }

          try {
            const message = JSON.parse(String(raw)) as ClientMessage;

            if (message.type === 'heartbeat') {
              socket.send(JSON.stringify({ type: 'heartbeat', serverNow: new Date().toISOString() }));
              return;
            }

            if (message.type === 'sync') {
              const body = message.payload as {
                attemptId: string;
                answers: unknown;
                currentQuestionId?: string | null;
                remainingSeconds?: number;
              };
              const parsed = syncAnswersSchema.parse({
                answers: body.answers,
                currentQuestionId: body.currentQuestionId,
                remainingSeconds: body.remainingSeconds,
              });
              const result = await attempts.sync(body.attemptId, userId, parsed);
              socket.send(
                JSON.stringify({
                  type: 'sync_ack',
                  remainingSeconds: result.remainingSeconds,
                  status: result.status,
                }),
              );
            }
          } catch (error) {
            socket.send(
              JSON.stringify({
                type: 'error',
                message: error instanceof Error ? error.message : 'Sync failed',
              }),
            );
          }
        })();
      });
    },
  );
};
