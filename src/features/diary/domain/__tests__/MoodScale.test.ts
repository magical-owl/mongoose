import { getManualMoodScore, MANUAL_MOOD_OPTIONS } from '@/features/diary/domain/DiaryEntry';

describe('manual mood scale', () => {
  it('exposes nine selectable moods', () => {
    expect(MANUAL_MOOD_OPTIONS).toEqual([
      'excited',
      'happy',
      'grateful',
      'calm',
      'neutral',
      'tired',
      'anxious',
      'sad',
      'angry',
    ]);
  });

  it('maps moods to signed scores from -4 through 4', () => {
    expect(getManualMoodScore('excited')).toBe(4);
    expect(getManualMoodScore('happy')).toBe(3);
    expect(getManualMoodScore('grateful')).toBe(2);
    expect(getManualMoodScore('calm')).toBe(1);
    expect(getManualMoodScore('neutral')).toBe(0);
    expect(getManualMoodScore('tired')).toBe(-1);
    expect(getManualMoodScore('anxious')).toBe(-2);
    expect(getManualMoodScore('sad')).toBe(-3);
    expect(getManualMoodScore('angry')).toBe(-4);
  });
});
