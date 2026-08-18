import type { ManualMood } from '@/features/diary/domain/DiaryEntry';

export type MoodKey = ManualMood;

const MOOD_EMOJI: Record<MoodKey, string> = {
  happy: '😊',
  sad: '😢',
  excited: '🤩',
  anxious: '😰',
  calm: '😌',
  angry: '😠',
  neutral: '😐',
  tired: '😴',
  grateful: '🙏',
};

export function normalizeMoodKey(mood: string): MoodKey {
  if (mood in MOOD_EMOJI) return mood as MoodKey;
  return 'neutral';
}

export function getMoodEmoji(mood: string): string {
  return MOOD_EMOJI[normalizeMoodKey(mood)];
}

export function getMoodLabel(mood: string): string {
  return normalizeMoodKey(mood).replace(/^./, (character) => character.toUpperCase());
}
