import { z } from 'zod';

import {
  QUESTION_DIFFICULTIES,
  QUESTION_STATUSES,
  QUESTION_TYPES,
} from './types.js';

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

export const taxonomyCreateSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(1000).optional().default(''),
  isActive: z.boolean().optional().default(true),
  sortOrder: z.number().int().min(0).optional().default(0),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase kebab-case')
    .optional(),
});

export const taxonomyUpdateSchema = taxonomyCreateSchema.partial();

export const subjectCreateSchema = taxonomyCreateSchema.extend({
  categoryId: objectIdSchema,
});

export const subjectUpdateSchema = taxonomyUpdateSchema.extend({
  categoryId: objectIdSchema.optional(),
});

export const chapterCreateSchema = taxonomyCreateSchema.extend({
  subjectId: objectIdSchema,
});

export const chapterUpdateSchema = taxonomyUpdateSchema.extend({
  subjectId: objectIdSchema.optional(),
});

export const topicCreateSchema = taxonomyCreateSchema.extend({
  chapterId: objectIdSchema,
});

export const topicUpdateSchema = taxonomyUpdateSchema.extend({
  chapterId: objectIdSchema.optional(),
});

export const questionOptionSchema = z.object({
  id: z.string().trim().min(1).max(64),
  text: z.string().trim().min(1).max(2000),
  imageUrl: z.string().min(1).max(500).optional(),
});

export const questionBodySchema = z.object({
  topicId: objectIdSchema,
  type: z.enum(QUESTION_TYPES).default('mcq_single'),
  stem: z.string().trim().min(1).max(20000),
  options: z.array(questionOptionSchema).min(2).max(8),
  correctOptionIds: z.array(z.string().trim().min(1)).min(1),
  explanation: z.string().max(20000).optional().default(''),
  difficulty: z.enum(QUESTION_DIFFICULTIES).default('medium'),
  marks: z.number().min(0).max(100).default(1),
  negativeMarks: z.number().min(0).max(100).default(0),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).optional().default([]),
  imageUrls: z.array(z.string().min(1).max(500)).max(10).optional().default([]),
  status: z.enum(QUESTION_STATUSES).default('draft'),
});

function refineQuestion(
  value: {
    type: (typeof QUESTION_TYPES)[number];
    options: Array<{ id: string }>;
    correctOptionIds: string[];
  },
  ctx: z.RefinementCtx,
) {
  const optionIds = new Set(value.options.map((option) => option.id));
  if (optionIds.size !== value.options.length) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Option ids must be unique',
      path: ['options'],
    });
  }

  for (const correctId of value.correctOptionIds) {
    if (!optionIds.has(correctId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Correct option ${correctId} is not in options`,
        path: ['correctOptionIds'],
      });
    }
  }

  if (value.type === 'mcq_single' && value.correctOptionIds.length !== 1) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Single choice questions require exactly one correct option',
      path: ['correctOptionIds'],
    });
  }
}

export const questionCreateSchema = questionBodySchema.superRefine(refineQuestion);

export const questionUpdateSchema = questionBodySchema.partial().superRefine((value, ctx) => {
  if (value.options && value.correctOptionIds && value.type) {
    refineQuestion(
      {
        type: value.type,
        options: value.options,
        correctOptionIds: value.correctOptionIds,
      },
      ctx,
    );
  }
});

export const questionListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(200).optional(),
  categoryId: objectIdSchema.optional(),
  subjectId: objectIdSchema.optional(),
  chapterId: objectIdSchema.optional(),
  topicId: objectIdSchema.optional(),
  status: z.enum(QUESTION_STATUSES).optional(),
  difficulty: z.enum(QUESTION_DIFFICULTIES).optional(),
});

export const bulkImportSchema = z.object({
  questions: z.array(questionCreateSchema).min(1).max(500),
});

export type TaxonomyCreateInput = z.infer<typeof taxonomyCreateSchema>;
export type TaxonomyUpdateInput = z.infer<typeof taxonomyUpdateSchema>;
export type SubjectCreateInput = z.infer<typeof subjectCreateSchema>;
export type SubjectUpdateInput = z.infer<typeof subjectUpdateSchema>;
export type ChapterCreateInput = z.infer<typeof chapterCreateSchema>;
export type ChapterUpdateInput = z.infer<typeof chapterUpdateSchema>;
export type TopicCreateInput = z.infer<typeof topicCreateSchema>;
export type TopicUpdateInput = z.infer<typeof topicUpdateSchema>;
export type QuestionCreateInput = z.infer<typeof questionCreateSchema>;
export type QuestionUpdateInput = z.infer<typeof questionUpdateSchema>;
export type QuestionListQuery = z.infer<typeof questionListQuerySchema>;
export type BulkImportInput = z.infer<typeof bulkImportSchema>;
