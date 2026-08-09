import fp from 'fastify-plugin';
import {
  AckPolicy,
  connect,
  StringCodec,
  type JetStreamClient,
  type JetStreamManager,
  type NatsConnection,
} from 'nats';

import { env } from '../config/env.js';
import { EvaluationService } from '../modules/exams/evaluation.service.js';
import { LiveExamStateService } from '../modules/exams/live-state.service.js';

const SUBJECT = 'exams.submit';
const STREAM = 'EXAMS';
const CONSUMER = 'exam-evaluators';

export type ExamSubmitJob = {
  attemptId: string;
};

declare module 'fastify' {
  interface FastifyInstance {
    natsConnected: boolean;
    publishExamSubmit: (job: ExamSubmitJob) => Promise<void>;
  }
}

export const natsPlugin = fp(async (app) => {
  let nc: NatsConnection | null = null;
  let js: JetStreamClient | null = null;
  let natsConnected = false;
  const sc = StringCodec();
  const evaluation = new EvaluationService();
  const liveState = new LiveExamStateService(app.redis);

  async function ensureStream(jsm: JetStreamManager) {
    try {
      await jsm.streams.info(STREAM);
    } catch {
      await jsm.streams.add({
        name: STREAM,
        subjects: [SUBJECT],
      });
    }
  }

  async function startConsumer() {
    if (!js || !nc) {
      return;
    }

    const jsm = await nc.jetstreamManager();
    await ensureStream(jsm);

    try {
      await jsm.consumers.info(STREAM, CONSUMER);
    } catch {
      await jsm.consumers.add(STREAM, {
        durable_name: CONSUMER,
        ack_policy: AckPolicy.Explicit,
        filter_subject: SUBJECT,
      });
    }

    const consumer = await js.consumers.get(STREAM, CONSUMER);
    const messages = await consumer.consume();

    void (async () => {
      for await (const message of messages) {
        try {
          const job = JSON.parse(sc.decode(message.data)) as ExamSubmitJob;
          await evaluation.evaluateAttempt(job.attemptId);
          await liveState.clear(job.attemptId);
          message.ack();
        } catch (error) {
          app.log.error({ err: error }, 'Exam evaluation failed');
          message.nak();
        }
      }
    })();
  }

  try {
    nc = await connect({ servers: env.NATS_URL });
    js = nc.jetstream();
    await startConsumer();
    natsConnected = true;
    app.log.info({ url: env.NATS_URL }, 'Connected to NATS JetStream');
  } catch (error) {
    app.log.warn(
      { err: error },
      'NATS unavailable — exam submissions will evaluate inline (start NATS for async workers).',
    );
  }

  app.decorate('natsConnected', natsConnected);
  app.decorate('publishExamSubmit', async (job: ExamSubmitJob) => {
    if (js && natsConnected) {
      await js.publish(SUBJECT, sc.encode(JSON.stringify(job)));
      return;
    }

    await evaluation.evaluateAttempt(job.attemptId);
    await liveState.clear(job.attemptId);
  });

  app.addHook('onClose', async () => {
    if (nc) {
      await nc.drain();
    }
  });
});
