import {
  normalizeMemoryReactions,
  toggleMemoryReactionSelection,
} from '@/features/diary/domain/MemoryReaction';

describe('MemoryReaction', () => {
  it('normalizes duplicate reactions', () => {
    expect(normalizeMemoryReactions(['cherish', 'treasure', 'wonder', 'cherish'])).toEqual([
      'cherish',
      'treasure',
      'wonder',
    ]);
  });

  it('toggles reactions independently', () => {
    expect(toggleMemoryReactionSelection(['cherish'], 'treasure')).toEqual(['cherish', 'treasure']);
    expect(toggleMemoryReactionSelection(['cherish', 'treasure'], 'cherish')).toEqual(['treasure']);
  });
});
