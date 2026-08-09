import type { Redis } from 'ioredis';

import type { ExamAnswerState, LiveExamState } from './types.js';

function liveKey(attemptId: string): string {
  return `exam:live:${attemptId}`;
}

export class LiveExamStateService {
  constructor(private readonly redis: Redis) {}

  async save(state: LiveExamState, ttlSeconds: number): Promise<void> {
    const ttl = Math.max(ttlSeconds, 60);
    await this.redis.set(liveKey(state.attemptId), JSON.stringify(state), 'EX', ttl);
  }

  async get(attemptId: string): Promise<LiveExamState | null> {
    const raw = await this.redis.get(liveKey(attemptId));
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as LiveExamState;
  }

  async mergeAnswers(
    attemptId: string,
    patch: {
      answers: Record<string, ExamAnswerState>;
      currentQuestionId?: string | null;
      remainingSeconds?: number;
    },
    ttlSeconds: number,
  ): Promise<LiveExamState | null> {
    const current = await this.get(attemptId);
    if (!current) {
      return null;
    }

    const next: LiveExamState = {
      ...current,
      answers: { ...current.answers, ...patch.answers },
      currentQuestionId:
        patch.currentQuestionId !== undefined ? patch.currentQuestionId : current.currentQuestionId,
      remainingSeconds:
        patch.remainingSeconds !== undefined ? patch.remainingSeconds : current.remainingSeconds,
      updatedAt: new Date().toISOString(),
    };

    await this.save(next, ttlSeconds);
    return next;
  }

  async clear(attemptId: string): Promise<void> {
    await this.redis.del(liveKey(attemptId));
  }
}
