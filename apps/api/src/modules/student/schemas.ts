import { z } from 'zod';

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

export const bookmarkCreateSchema = z.object({
  questionId: objectIdSchema,
  note: z.string().trim().max(500).optional().default(''),
});

export const practiceStartSchema = z.object({
  topicId: objectIdSchema,
  count: z.coerce.number().int().min(1).max(50).default(10),
});

export const practiceSubmitSchema = z.object({
  answers: z
    .array(
      z.object({
        questionId: objectIdSchema,
        selectedOptionIds: z.array(z.string()).default([]),
      }),
    )
    .min(1),
});

export const leaderboardQuerySchema = z.object({
  examId: objectIdSchema.optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type BookmarkCreateInput = z.infer<typeof bookmarkCreateSchema>;
export type PracticeStartInput = z.infer<typeof practiceStartSchema>;
export type PracticeSubmitInput = z.infer<typeof practiceSubmitSchema>;
