import { z } from 'zod';

export const contactCreateSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(160),
  subject: z.string().trim().min(3).max(160),
  message: z.string().trim().min(10).max(5000),
});

export type ContactCreateInput = z.infer<typeof contactCreateSchema>;
