import {
  BUILTIN_JOURNAL_BACKGROUNDS,
  BUILTIN_JOURNAL_COVER_PREFIX,
  findBuiltinJournalBackground,
  getJournalCoverImageSource,
} from '@/features/journal/domain/JournalBackgrounds';

describe('JournalBackgrounds', () => {
  it('defines the bundled journal background choices', () => {
    expect(BUILTIN_JOURNAL_BACKGROUNDS.map((background) => background.id)).toEqual([
      'default-journal',
      'meadow-day',
      'meadow-sunset',
      'meadow-night',
      'winter',
      'summer',
      'moonlit-lake',
      'mountain-sunrise',
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

  it('does not treat removed built-in backgrounds as remote image URLs', () => {
    expect(getJournalCoverImageSource(`${BUILTIN_JOURNAL_COVER_PREFIX}art-studio`)).toBe(BUILTIN_JOURNAL_BACKGROUNDS[0]?.source);
    expect(getJournalCoverImageSource(`${BUILTIN_JOURNAL_COVER_PREFIX}botanical-desk`)).toBe(BUILTIN_JOURNAL_BACKGROUNDS[0]?.source);
  });
});
