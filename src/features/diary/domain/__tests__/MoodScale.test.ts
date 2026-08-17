import { getManualMoodScore, MANUAL_MOOD_OPTIONS } from '@/features/diary/domain/DiaryEntry';

describe('manual mood scale', () => {
  it('exposes five selectable moods', () => {
    expect(MANUAL_MOOD_OPTIONS).toEqual(['excited', 'happy', 'neutral', 'sad', 'angry']);
  });

  it('maps moods to signed scores', () => {
    expect(getManualMoodScore('excited')).toBe(2);
    expect(getManualMoodScore('neutral')).toBe(0);
    expect(getManualMoodScore('happy')).toBe(1);
    expect(getManualMoodScore('sad')).toBe(-1);
    expect(getManualMoodScore('angry')).toBe(-2);
  });
});
