import { getMoodEmoji, getMoodLabel, normalizeMoodKey } from '../Mood';

describe('Mood normalization', () => {
  it('renders stable mood keys directly', () => {
    expect(normalizeMoodKey('happy')).toBe('happy');
    expect(getMoodEmoji('anxious')).toBe('😰');
    expect(getMoodLabel('grateful')).toBe('Grateful');
  });

  it('uses a neutral fallback for unknown values', () => {
    expect(normalizeMoodKey('unknown')).toBe('neutral');
    expect(getMoodEmoji('unknown')).toBe('😐');
  });
});
