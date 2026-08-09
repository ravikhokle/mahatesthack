import { z } from 'zod';

import { EXAM_STATUSES, EXAM_TYPES } from './types.js';

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

export const examCreateSchema = z.object({
  title: z.string().trim().min(3).max(200),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional(),
  description: z.string().trim().max(2000).optional().default(''),
  type: z.enum(EXAM_TYPES),
  testSeriesId: objectIdSchema.nullable().optional(),
  durationMinutes: z.number().int().min(1).max(600),
  questionIds: z.array(objectIdSchema).min(1).max(300),
  negativeMarking: z.boolean().default(true),
  status: z.enum(EXAM_STATUSES).default('draft'),
  year: z.number().int().min(1990).max(2100).nullable().optional(),
  quizDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
});

export const examUpdateSchema = examCreateSchema.partial();

export const testSeriesCreateSchema = z.object({
  title: z.string().trim().min(3).max(200),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional(),
  description: z.string().trim().max(2000).optional().default(''),
  isActive: z.boolean().default(true),
  examIds: z.array(objectIdSchema).max(100).optional().default([]),
});

export const testSeriesUpdateSchema = testSeriesCreateSchema.partial();

export const answerStateSchema = z.object({
  selectedOptionIds: z.array(z.string()).default([]),
  markedForReview: z.boolean().default(false),
  visited: z.boolean().default(true),
  updatedAt: z.string().datetime().optional(),
});

export const syncAnswersSchema = z.object({
  answers: z.record(z.string(), answerStateSchema),
  currentQuestionId: objectIdSchema.nullable().optional(),
  remainingSeconds: z.number().int().min(0).optional(),
});

export const listExamsQuerySchema = z.object({
  type: z.enum(EXAM_TYPES).optional(),
  status: z.enum(EXAM_STATUSES).optional(),
  testSeriesId: objectIdSchema.optional(),
});

export type ExamCreateInput = z.infer<typeof examCreateSchema>;
export type ExamUpdateInput = z.infer<typeof examUpdateSchema>;
export type TestSeriesCreateInput = z.infer<typeof testSeriesCreateSchema>;
export type TestSeriesUpdateInput = z.infer<typeof testSeriesUpdateSchema>;
export type SyncAnswersInput = z.infer<typeof syncAnswersSchema>;
