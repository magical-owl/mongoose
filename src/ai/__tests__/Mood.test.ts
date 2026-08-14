import { getMoodEmoji, getMoodLabel, normalizeMoodKey } from '../Mood';

describe('Mood normalization', () => {
  it('renders stable mood keys directly', () => {
    expect(normalizeMoodKey('happy')).toBe('happy');
    expect(getMoodEmoji('anxious')).toBe('😰');
    expect(getMoodLabel('grateful')).toBe('Grateful');
  });

  it('keeps legacy sentiment labels renderable', () => {
    expect(normalizeMoodKey('Joyful 🌟')).toBe('happy');
    expect(getMoodEmoji('Stressed 🌊')).toBe('😰');
  });

  it('uses a neutral fallback for unknown values', () => {
    expect(normalizeMoodKey('unknown')).toBe('neutral');
    expect(getMoodEmoji('unknown')).toBe('😐');
  });
});
