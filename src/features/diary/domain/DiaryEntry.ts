import { z } from 'zod';
import { PlacedStickerSchema } from './Sticker';
import { CompanionTypeSchema } from './Companion';
import { DiaryBodyFontFamilySchema, DiaryBodyTextColorSchema } from './DiaryBodyStyle';
import { MemoryReactionSchema } from './MemoryReaction';

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

/** Nine moods available for new entries, mapped from -4 through 4. */
export const MANUAL_MOOD_OPTIONS: readonly ManualMood[] = [
  'excited',
  'happy',
  'grateful',
  'calm',
  'neutral',
  'tired',
  'anxious',
  'sad',
  'angry',
];
export const MANUAL_MOOD_SCORES: Readonly<Record<ManualMood, number>> = {
  excited: 4,
  happy: 3,
  grateful: 2,
  calm: 1,
  neutral: 0,
  tired: -1,
  anxious: -2,
  sad: -3,
  angry: -4,
};

export function getManualMoodScore(mood: ManualMood | undefined): number {
  return mood ? MANUAL_MOOD_SCORES[mood] : 0;
}

export function normalizeManualMoods(
  moods?: readonly ManualMood[],
  fallbackMood?: ManualMood,
): ManualMood[] {
  const source = moods && moods.length > 0 ? moods : fallbackMood ? [fallbackMood] : [];
  const unique = Array.from(new Set(source));
  if (unique.length > 1) return unique.filter((mood) => mood !== 'neutral');
  return unique;
}

export function getPrimaryManualMood(moods?: readonly ManualMood[]): ManualMood | undefined {
  return moods?.[0];
}

export function toggleManualMoodSelection(
  selectedMoods: readonly ManualMood[],
  mood: ManualMood,
): ManualMood[] {
  if (mood === 'neutral') return ['neutral'];

  const withoutNeutral = selectedMoods.filter((selected) => selected !== 'neutral');
  const next = withoutNeutral.includes(mood)
    ? withoutNeutral.filter((selected) => selected !== mood)
    : [...withoutNeutral, mood];
  return next.length > 0 ? next : ['neutral'];
}

export function getEntryManualMoods(entry: {
  readonly manualMoods?: readonly ManualMood[];
  readonly manualMood?: ManualMood;
}): ManualMood[] {
  return normalizeManualMoods(entry.manualMoods, entry.manualMood);
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

export const DiaryPhotoSchema = z.object({
  id: z.string().uuid(),
  uri: z.string().min(1),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  createdAt: z.string().datetime(),
});
export type DiaryPhoto = z.infer<typeof DiaryPhotoSchema>;

export const DiaryReflectionSchema = z.object({
  id: z.string().uuid(),
  text: z.string().min(1).max(2000),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  photo: DiaryPhotoSchema.optional(),
});
export type DiaryReflection = z.infer<typeof DiaryReflectionSchema>;

export const DiaryEntrySchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1, 'Title is required').max(150),
  content: z.string().min(1, 'Content cannot be empty'),
  date: z.string(),                                      // YYYY-MM-DD
  paperBackgroundId: z.string().default('vintage-parchment'),
  bodyFontFamily: DiaryBodyFontFamilySchema.default('system'),
  bodyTextColor: DiaryBodyTextColorSchema.optional(),
  stickers: z.array(PlacedStickerSchema).default([]),
  companion: CompanionTypeSchema.default('cat'),
  isFavorite: z.boolean().default(false),
  viewCount: z.number().int().nonnegative().optional(),
  memoryReactions: z.array(MemoryReactionSchema).default([]),
  tags: z.array(z.string()).default([]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  deletedAt: z.string().datetime().optional(),
  manualMoodWeather: ManualMoodWeatherSchema.default('neutral'),
  /** Optional for backwards compatibility with entries created before manual mood selection. */
  manualMood: ManualMoodSchema.optional(),
  /** Canonical multi-select mood values. `manualMood` remains as the primary mood for legacy readers. */
  manualMoods: z.array(ManualMoodSchema).default([]),
  writingMode: WritingModeSchema.default('free-write'),
  sensory: SensoryDetailsSchema.default({ locationLabel: '', sounds: '', smells: '', energyLevel: 5, bodyState: '' }),
  timeCapsuleUnlockAt: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional(),
  isLockbox: z.boolean().default(false),
  chapterId: z.string().uuid().optional(),
  collectionIds: z.array(z.string().uuid()).default([]),
  journalIds: z.array(z.string().uuid()).default([]),
  coverPhoto: DiaryPhotoSchema.optional(),
  photos: z.array(DiaryPhotoSchema).default([]),
  reflections: z.array(DiaryReflectionSchema).default([]),
});

export type DiaryEntry = z.infer<typeof DiaryEntrySchema>;
