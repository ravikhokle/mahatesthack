import { z } from 'zod';

export const taxonomyFormSchema = z.object({
  name: z.string().trim().min(2, 'Name is required').max(120),
  description: z.string().trim().max(1000).optional(),
  sortOrder: z.coerce.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const questionOptionFormSchema = z.object({
  id: z.string().min(1),
  text: z.string().trim().min(1, 'Option text required'),
  imageUrl: z.string().optional(),
});

export const questionFormSchema = z
  .object({
    topicId: z.string().min(1, 'Select a topic'),
    type: z.enum(['mcq_single', 'mcq_multiple']),
    stem: z.string().trim().min(1, 'Question stem is required'),
    options: z.array(questionOptionFormSchema).min(2).max(8),
    correctOptionIds: z.array(z.string()).min(1, 'Mark at least one correct option'),
    explanation: z.string().default(''),
    difficulty: z.enum(['easy', 'medium', 'hard']),
    marks: z.coerce.number().min(0).max(100),
    negativeMarks: z.coerce.number().min(0).max(100),
    tags: z.string().default(''),
    status: z.enum(['draft', 'published', 'archived']),
  })
  .superRefine((value, ctx) => {
    if (value.type === 'mcq_single' && value.correctOptionIds.length !== 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Single choice needs exactly one correct answer',
        path: ['correctOptionIds'],
      });
    }
  });

export type TaxonomyFormInput = z.infer<typeof taxonomyFormSchema>;
export type QuestionFormInput = z.infer<typeof questionFormSchema>;
