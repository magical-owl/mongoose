import { z } from 'zod';

export const SentimentSchema = z.object({
  mood: z.string().default('neutral'),                 // Stable UI key; legacy labels are normalized at render time.
  summary: z.string().default('No summary generated.'),  // 2-sentence summary
  emotional_analysis: z.string().default(''),           // Emotional insight
  supportive_message: z.string().default(''),          // AI Companion encouraging message
  suggestion: z.string().default(''),                  // Self-care action tip
});

export type Sentiment = z.infer<typeof SentimentSchema>;
