import type { ManualMood } from './DiaryEntry';

interface MoodColorPalette {
  readonly moodExcited: string;
  readonly moodHappy: string;
  readonly moodNeutral: string;
  readonly moodSad: string;
  readonly moodAngry: string;
}

export function getManualMoodColor(mood: ManualMood | undefined, colors: MoodColorPalette): string {
  if (mood === 'excited') return colors.moodExcited;
  if (mood === 'happy' || mood === 'calm' || mood === 'grateful') return colors.moodHappy;
  if (mood === 'sad' || mood === 'tired' || mood === 'anxious') return colors.moodSad;
  if (mood === 'angry') return colors.moodAngry;
  return colors.moodNeutral;
}
