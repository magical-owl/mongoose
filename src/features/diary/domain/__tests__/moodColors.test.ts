import { MANUAL_MOOD_OPTIONS } from '@/features/diary/domain/DiaryEntry';
import { getManualMoodColor } from '@/features/diary/domain/moodColors';

const colors = {
  moodExcited: '#D81B60',
  moodHappy: '#F59E0B',
  moodGrateful: '#7C3AED',
  moodCalm: '#0F766E',
  moodNeutral: '#6B7280',
  moodTired: '#64748B',
  moodAnxious: '#EA580C',
  moodSad: '#1D4ED8',
  moodAngry: '#B91C1C',
};

describe('manual mood colors', () => {
  it('uses a unique color for every selectable mood', () => {
    const moodColors = MANUAL_MOOD_OPTIONS.map((mood) => getManualMoodColor(mood, colors));

    expect(new Set(moodColors).size).toBe(MANUAL_MOOD_OPTIONS.length);
  });
});
