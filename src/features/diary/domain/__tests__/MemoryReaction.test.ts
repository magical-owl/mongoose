import {
  normalizeMemoryReactions,
  toggleMemoryReactionSelection,
} from '@/features/diary/domain/MemoryReaction';

describe('MemoryReaction', () => {
  it('normalizes reactions to a single selected reaction', () => {
    expect(normalizeMemoryReactions(['cherish', 'treasure', 'wonder', 'cherish'])).toEqual([
      'cherish',
    ]);
  });

  it('replaces the selected reaction when toggling a different reaction', () => {
    expect(toggleMemoryReactionSelection(['cherish'], 'treasure')).toEqual(['treasure']);
  });

  it('clears the selected reaction when toggling the same reaction', () => {
    expect(toggleMemoryReactionSelection(['cherish'], 'cherish')).toEqual([]);
  });
});
