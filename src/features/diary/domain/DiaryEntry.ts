import { z } from 'zod';
import { PlacedStickerSchema } from './Sticker';
import { CompanionTypeSchema } from './Companion';
import { SentimentSchema } from './Sentiment';

export const ManualMoodWeatherSchema = z.enum(['sunny', 'cloudy', 'stormy', 'foggy', 'windy', 'calm']);
export type ManualMoodWeather = z.infer<typeof ManualMoodWeatherSchema>;

export const WritingModeSchema = z.enum(['free-write', 'one-line', 'five-minute', 'gratitude', 'travel', 'dream', 'evening-review']);
export type WritingMode = z.infer<typeof WritingModeSchema>;

export const SensoryDetailsSchema = z.object({
  locationLabel: z.string().max(100).default(''),
  sounds: z.string().max(200).default(''),
  smells: z.string().max(200).default(''),
  energyLevel: z.number().min(1).max(10).default(5),
  bodyState: z.string().max(200).default(''),
});
export type SensoryDetails = z.infer<typeof SensoryDetailsSchema>;

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
  manualMoodWeather: ManualMoodWeatherSchema.default('calm'),
  writingMode: WritingModeSchema.default('free-write'),
  sensory: SensoryDetailsSchema.default({ locationLabel: '', sounds: '', smells: '', energyLevel: 5, bodyState: '' }),
  timeCapsuleUnlockAt: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional(),
  isLockbox: z.boolean().default(false),
  chapterId: z.string().uuid().optional(),
  collectionIds: z.array(z.string().uuid()).default([]),
});

export type DiaryEntry = z.infer<typeof DiaryEntrySchema>;
