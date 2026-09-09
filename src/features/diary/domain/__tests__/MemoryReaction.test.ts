import {
  getMemoryReactionStats,
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

  it('summarizes entry and reflection reactions in descending order', () => {
    expect(
      getMemoryReactionStats([
        {
          memoryReactions: ['cherish'],
          reflections: [
            { memoryReactions: ['treasure'] },
            { memoryReactions: ['treasure', 'cherish'] },
          ],
        },
        {
          memoryReactions: ['treasure'],
          reflections: [{ memoryReactions: ['cherish'] }],
        },
        {
          memoryReactions: [],
          reflections: [{ memoryReactions: [] }],
        },
      ]),
    ).toEqual([
      { reaction: 'treasure', entryCount: 1, reflectionCount: 2, total: 3 },
      { reaction: 'cherish', entryCount: 1, reflectionCount: 1, total: 2 },
    ]);
  });
});
