import type { ManualMood } from './DiaryEntry';

interface MoodColorPalette {
  readonly moodExcited: string;
  readonly moodHappy: string;
  readonly moodGrateful: string;
  readonly moodCalm: string;
  readonly moodNeutral: string;
  readonly moodTired: string;
  readonly moodAnxious: string;
  readonly moodSad: string;
  readonly moodAngry: string;
}

export function getManualMoodColor(mood: ManualMood | undefined, colors: MoodColorPalette): string {
  if (mood === 'excited') return colors.moodExcited;
  if (mood === 'happy') return colors.moodHappy;
  if (mood === 'grateful') return colors.moodGrateful;
  if (mood === 'calm') return colors.moodCalm;
  if (mood === 'tired') return colors.moodTired;
  if (mood === 'anxious') return colors.moodAnxious;
  if (mood === 'sad') return colors.moodSad;
  if (mood === 'angry') return colors.moodAngry;
  return colors.moodNeutral;
}
