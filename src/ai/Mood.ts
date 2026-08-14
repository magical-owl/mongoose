export type MoodKey =
  | 'happy'
  | 'sad'
  | 'excited'
  | 'anxious'
  | 'calm'
  | 'angry'
  | 'neutral'
  | 'tired'
  | 'grateful';

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

const LEGACY_MOOD_KEYS: Record<string, MoodKey> = {
  'Joyful 🌟': 'happy',
  'Excited ⚡': 'excited',
  'Loving 💛': 'happy',
  'Grateful 🙏': 'grateful',
  'Calm ☕': 'calm',
  'Reflective 🌿': 'neutral',
  'Tired 🌙': 'tired',
  'Stressed 🌊': 'anxious',
  'Sad 🌧️': 'sad',
  'Frustrated 🔥': 'angry',
};

export function normalizeMoodKey(mood: string): MoodKey {
  if (mood in MOOD_EMOJI) return mood as MoodKey;
  return LEGACY_MOOD_KEYS[mood] ?? 'neutral';
}

export function getMoodEmoji(mood: string): string {
  return MOOD_EMOJI[normalizeMoodKey(mood)];
}

export function getMoodLabel(mood: string): string {
  return normalizeMoodKey(mood).replace(/^./, (character) => character.toUpperCase());
}
