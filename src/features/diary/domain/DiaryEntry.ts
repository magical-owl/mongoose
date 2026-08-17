import { z } from 'zod';
import { PlacedStickerSchema } from './Sticker';
import { CompanionTypeSchema } from './Companion';

export const ManualMoodWeatherSchema = z.enum(['sunny', 'cloudy', 'stormy', 'foggy', 'windy', 'calm', 'neutral']);
export type ManualMoodWeather = z.infer<typeof ManualMoodWeatherSchema>;

/** Five weather states available for new entries. Legacy states remain valid for saved entries. */
export const MANUAL_MOOD_WEATHER_OPTIONS: readonly ManualMoodWeather[] = ['sunny', 'calm', 'neutral', 'cloudy', 'stormy'];
export const MANUAL_MOOD_WEATHER_SCORES: Readonly<Record<ManualMoodWeather, number>> = {
  stormy: -2,
  cloudy: -1,
  neutral: 0,
  calm: 1,
  sunny: 2,
  foggy: -1,
  windy: 0,
};

export function getManualMoodWeatherScore(weather: ManualMoodWeather | undefined): number {
  return weather ? MANUAL_MOOD_WEATHER_SCORES[weather] : 0;
}

export const ManualMoodSchema = z.enum(['happy', 'calm', 'sad', 'anxious', 'angry', 'grateful', 'excited', 'tired', 'neutral']);
export type ManualMood = z.infer<typeof ManualMoodSchema>;

/** Five moods available for new entries. Legacy moods remain valid for saved entries. */
export const MANUAL_MOOD_OPTIONS: readonly ManualMood[] = ['excited', 'happy', 'neutral', 'sad', 'angry'];
export const MANUAL_MOOD_SCORES: Readonly<Record<ManualMood, number>> = {
  excited: 2,
  happy: 1,
  neutral: 0,
  sad: -1,
  angry: -2,
  calm: 0,
  anxious: -1,
  grateful: 1,
  tired: -1,
};

export function getManualMoodScore(mood: ManualMood | undefined): number {
  return mood ? MANUAL_MOOD_SCORES[mood] : 0;
}

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
  isFavorite: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  manualMoodWeather: ManualMoodWeatherSchema.default('neutral'),
  /** Optional for backwards compatibility with entries created before manual mood selection. */
  manualMood: ManualMoodSchema.optional(),
  writingMode: WritingModeSchema.default('free-write'),
  sensory: SensoryDetailsSchema.default({ locationLabel: '', sounds: '', smells: '', energyLevel: 5, bodyState: '' }),
  timeCapsuleUnlockAt: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional(),
  isLockbox: z.boolean().default(false),
  chapterId: z.string().uuid().optional(),
  collectionIds: z.array(z.string().uuid()).default([]),
});

export type DiaryEntry = z.infer<typeof DiaryEntrySchema>;
