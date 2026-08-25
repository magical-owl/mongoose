import { z } from 'zod';

export const JournalSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(80),
  description: z.string().max(280).default(''),
  color: z.string().default('#4ECDC4'),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Journal = z.infer<typeof JournalSchema>;
