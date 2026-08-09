'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import { useAuthStore } from '@/features/auth/store';
import * as examsApi from '@/features/exams/api';
import {
  clearPendingSync,
  getExamPackage,
  getLocalAnswers,
  saveExamPackage,
  saveLocalAnswers,
} from '@/features/exams/idb';
import type { ExamAnswerState, ExamPackage } from '@/features/exams/types';
import { ApiError } from '@/lib/api';

function emptyAnswer(): ExamAnswerState {
  return {
    selectedOptionIds: [],
    markedForReview: false,
    visited: true,
    updatedAt: new Date().toISOString(),
  };
}

export function useExamPlayer(attemptId: string) {
  const router = useRouter();
  const accessToken = useAuthStore((state) => state.accessToken);
  const [pkg, setPkg] = useState<ExamPackage | null>(null);
  const [answers, setAnswers] = useState<Record<string, ExamAnswerState>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [syncState, setSyncState] = useState<'idle' | 'syncing' | 'offline' | 'ok'>('idle');
  const wsRef = useRef<WebSocket | null>(null);
  const answersRef = useRef(answers);
  const currentIndexRef = useRef(currentIndex);
  const remainingRef = useRef(remainingSeconds);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);
  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);
  useEffect(() => {
    remainingRef.current = remainingSeconds;
  }, [remainingSeconds]);

  const currentQuestion = pkg?.questions[currentIndex] ?? null;

  const palette = useMemo(() => {
    if (!pkg) {
      return [];
    }
    return pkg.questions.map((question, index) => {
      const answer = answers[question.id];
      const answered = (answer?.selectedOptionIds.length ?? 0) > 0;
      return {
        index,
        questionId: question.id,
        answered,
        markedForReview: answer?.markedForReview ?? false,
        visited: answer?.visited ?? false,
        current: index === currentIndex,
      };
    });
  }, [answers, currentIndex, pkg]);

  const persistLocal = useCallback(
    async (
      nextAnswers: Record<string, ExamAnswerState>,
      questionId: string | null,
      seconds: number,
    ) => {
      await saveLocalAnswers(attemptId, nextAnswers, questionId, seconds);
    },
    [attemptId],
  );

  const pushSync = useCallback(
    async (nextAnswers: Record<string, ExamAnswerState>, questionId: string | null, seconds: number) => {
      if (!accessToken) {
        return;
      }
      setSyncState('syncing');
      const payload = {
        answers: nextAnswers,
        currentQuestionId: questionId,
        remainingSeconds: seconds,
      };

      try {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(
            JSON.stringify({
              type: 'sync',
              payload: { attemptId, ...payload },
            }),
          );
          setSyncState('ok');
          await clearPendingSync(attemptId);
          return;
        }

        await examsApi.syncAttempt(accessToken, attemptId, payload);
        await clearPendingSync(attemptId);
        setSyncState('ok');
      } catch {
        setSyncState('offline');
      }
    },
    [accessToken, attemptId],
  );

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    void (async () => {
      try {
        const cached = await getExamPackage(attemptId);
        const remote = await examsApi.getPackage(accessToken, attemptId);
        const nextPkg = remote.package;
        await saveExamPackage(nextPkg);

        const local = await getLocalAnswers(attemptId);
        const mergedAnswers = {
          ...nextPkg.answers,
          ...(local?.answers ?? {}),
          ...(cached?.answers ?? {}),
        };

        const endsAt = new Date(nextPkg.endsAt).getTime();
        const seconds = Math.max(0, Math.floor((endsAt - Date.now()) / 1000));

        setPkg(nextPkg);
        setAnswers(mergedAnswers);
        setRemainingSeconds(local?.remainingSeconds ?? seconds);

        const startId = local?.currentQuestionId ?? nextPkg.questions[0]?.id;
        const startIndex = Math.max(
          0,
          nextPkg.questions.findIndex((question) => question.id === startId),
        );
        setCurrentIndex(startIndex === -1 ? 0 : startIndex);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Failed to load exam');
      }
    })();
  }, [accessToken, attemptId]);

  useEffect(() => {
    if (!accessToken || !pkg) {
      return;
    }

    const url = examsApi.getWsUrl(accessToken);
    const socket = new WebSocket(url);
    wsRef.current = socket;

    socket.onopen = () => {
      setSyncState('ok');
    };
    socket.onclose = () => {
      setSyncState('offline');
    };
    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(String(event.data)) as {
          type: string;
          remainingSeconds?: number;
          status?: string;
        };
        if (message.type === 'sync_ack' && typeof message.remainingSeconds === 'number') {
          setRemainingSeconds(message.remainingSeconds);
        }
        if (message.status === 'submitted') {
          router.push(`/exams/attempts/${attemptId}/result`);
        }
      } catch {
        // ignore malformed frames
      }
    };

    const heartbeat = window.setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'heartbeat' }));
      }
    }, 15000);

    return () => {
      window.clearInterval(heartbeat);
      socket.close();
      wsRef.current = null;
    };
  }, [accessToken, attemptId, pkg, router]);

  useEffect(() => {
    if (!pkg) {
      return;
    }

    const timer = window.setInterval(() => {
      setRemainingSeconds((value) => {
        if (value <= 1) {
          window.clearInterval(timer);
          void (async () => {
            if (!accessToken || submitting) {
              return;
            }
            setSubmitting(true);
            try {
              await examsApi.submitAttempt(accessToken, attemptId);
              router.push(`/exams/attempts/${attemptId}/result`);
            } catch (err) {
              setError(err instanceof ApiError ? err.message : 'Auto-submit failed');
              setSubmitting(false);
            }
          })();
          return 0;
        }
        return value - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [accessToken, attemptId, pkg, router, submitting]);

  useEffect(() => {
    if (!pkg) {
      return;
    }
    const autosave = window.setInterval(() => {
      const questionId = pkg.questions[currentIndexRef.current]?.id ?? null;
      void persistLocal(answersRef.current, questionId, remainingRef.current);
      void pushSync(answersRef.current, questionId, remainingRef.current);
    }, 5000);

    return () => window.clearInterval(autosave);
  }, [persistLocal, pkg, pushSync]);

  const selectOption = async (optionId: string) => {
    if (!currentQuestion) {
      return;
    }

    const previous = answers[currentQuestion.id] ?? emptyAnswer();
    let selected = previous.selectedOptionIds;

    if (currentQuestion.type === 'mcq_single') {
      selected = [optionId];
    } else {
      selected = selected.includes(optionId)
        ? selected.filter((id) => id !== optionId)
        : [...selected, optionId];
    }

    const nextAnswers = {
      ...answers,
      [currentQuestion.id]: {
        ...previous,
        selectedOptionIds: selected,
        visited: true,
        updatedAt: new Date().toISOString(),
      },
    };

    setAnswers(nextAnswers);
    await persistLocal(nextAnswers, currentQuestion.id, remainingSeconds);
    void pushSync(nextAnswers, currentQuestion.id, remainingSeconds);
  };

  const toggleReview = async () => {
    if (!currentQuestion) {
      return;
    }
    const previous = answers[currentQuestion.id] ?? emptyAnswer();
    const nextAnswers = {
      ...answers,
      [currentQuestion.id]: {
        ...previous,
        markedForReview: !previous.markedForReview,
        visited: true,
        updatedAt: new Date().toISOString(),
      },
    };
    setAnswers(nextAnswers);
    await persistLocal(nextAnswers, currentQuestion.id, remainingSeconds);
    void pushSync(nextAnswers, currentQuestion.id, remainingSeconds);
  };

  const goTo = async (index: number) => {
    if (!pkg) {
      return;
    }
    const question = pkg.questions[index];
    if (!question) {
      return;
    }
    setCurrentIndex(index);
    const previous = answers[question.id] ?? emptyAnswer();
    const nextAnswers = {
      ...answers,
      [question.id]: {
        ...previous,
        visited: true,
        updatedAt: new Date().toISOString(),
      },
    };
    setAnswers(nextAnswers);
    await persistLocal(nextAnswers, question.id, remainingSeconds);
  };

  const submit = async () => {
    if (!accessToken) {
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const questionId = pkg?.questions[currentIndex]?.id ?? null;
      await pushSync(answers, questionId, remainingSeconds);
      await examsApi.submitAttempt(accessToken, attemptId);
      router.push(`/exams/attempts/${attemptId}/result`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Submit failed');
      setSubmitting(false);
    }
  };

  return {
    pkg,
    answers,
    currentQuestion,
    currentIndex,
    remainingSeconds,
    palette,
    error,
    submitting,
    syncState,
    selectOption,
    toggleReview,
    goTo,
    submit,
  };
}
