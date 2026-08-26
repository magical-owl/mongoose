import {
  BUILTIN_JOURNAL_BACKGROUNDS,
  BUILTIN_JOURNAL_COVER_PREFIX,
  findBuiltinJournalBackground,
  getJournalCoverImageSource,
} from '@/features/journal/domain/JournalBackgrounds';

describe('JournalBackgrounds', () => {
  it('defines the bundled journal background choices', () => {
    expect(BUILTIN_JOURNAL_BACKGROUNDS.map((background) => background.id)).toEqual([
      'botanical-desk',
      'moonlit-lake',
      'cozy-reading-nook',
      'school',
      'office',
      'summer',
    ]);
    expect(BUILTIN_JOURNAL_BACKGROUNDS.every((background) => background.uri.startsWith(BUILTIN_JOURNAL_COVER_PREFIX))).toBe(true);
  });

  it('resolves built-in and gallery cover sources', () => {
    const builtin = BUILTIN_JOURNAL_BACKGROUNDS[0]!;
    expect(findBuiltinJournalBackground(builtin.uri)).toEqual(builtin);
    expect(getJournalCoverImageSource(builtin.uri)).toBe(builtin.source);
    expect(getJournalCoverImageSource('file:///tmp/journal.png')).toEqual({ uri: 'file:///tmp/journal.png' });
    expect(getJournalCoverImageSource()).toBeUndefined();
  });
});
