import { z } from 'zod';
import { PlacedStickerSchema } from './Sticker';
import { CompanionTypeSchema } from './Companion';
import { SentimentSchema } from './Sentiment';

export const DiaryEntrySchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1, 'Title is required').max(150),
  content: z.string().min(1, 'Content cannot be empty'),
  date: z.string(),                                      // YYYY-MM-DD
  paperBackgroundId: z.string().default('vintage-parchment'),
  stickers: z.array(PlacedStickerSchema).default([]),
  companion: CompanionTypeSchema.default('cat'),
  sentiment: SentimentSchema.optional(),
  isFavorite: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type DiaryEntry = z.infer<typeof DiaryEntrySchema>;
