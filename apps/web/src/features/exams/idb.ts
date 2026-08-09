import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

import type { ExamAnswerState, ExamPackage } from './types';

interface ExamDb extends DBSchema {
  packages: {
    key: string;
    value: ExamPackage;
  };
  answers: {
    key: string;
    value: {
      attemptId: string;
      answers: Record<string, ExamAnswerState>;
      currentQuestionId: string | null;
      remainingSeconds: number;
      updatedAt: string;
    };
  };
  pendingSync: {
    key: string;
    value: {
      attemptId: string;
      payload: {
        answers: Record<string, ExamAnswerState>;
        currentQuestionId: string | null;
        remainingSeconds: number;
      };
      queuedAt: string;
    };
  };
}

let dbPromise: Promise<IDBPDatabase<ExamDb>> | null = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<ExamDb>('mahatest-exams', 1, {
      upgrade(db) {
        db.createObjectStore('packages', { keyPath: 'attemptId' });
        db.createObjectStore('answers', { keyPath: 'attemptId' });
        db.createObjectStore('pendingSync', { keyPath: 'attemptId' });
      },
    });
  }
  return dbPromise;
}

export async function saveExamPackage(pkg: ExamPackage): Promise<void> {
  const db = await getDb();
  await db.put('packages', pkg);
}

export async function getExamPackage(attemptId: string): Promise<ExamPackage | undefined> {
  const db = await getDb();
  return db.get('packages', attemptId);
}

export async function saveLocalAnswers(
  attemptId: string,
  answers: Record<string, ExamAnswerState>,
  currentQuestionId: string | null,
  remainingSeconds: number,
): Promise<void> {
  const db = await getDb();
  await db.put('answers', {
    attemptId,
    answers,
    currentQuestionId,
    remainingSeconds,
    updatedAt: new Date().toISOString(),
  });
  await db.put('pendingSync', {
    attemptId,
    payload: { answers, currentQuestionId, remainingSeconds },
    queuedAt: new Date().toISOString(),
  });
}

export async function getLocalAnswers(attemptId: string) {
  const db = await getDb();
  return db.get('answers', attemptId);
}

export async function clearPendingSync(attemptId: string): Promise<void> {
  const db = await getDb();
  await db.delete('pendingSync', attemptId);
}

export async function getPendingSync(attemptId: string) {
  const db = await getDb();
  return db.get('pendingSync', attemptId);
}
