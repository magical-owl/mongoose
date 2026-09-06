const { createStressData, parseArgs } = require('../generate-stress-journal-data');

const CURRENT_DIARY_SCHEMA_VERSION = 7;
const CURRENT_COVER_URIS = new Set([
  'builtin://journal-background/default-journal',
  'builtin://journal-background/meadow-day',
  'builtin://journal-background/meadow-sunset',
  'builtin://journal-background/meadow-night',
  'builtin://journal-background/winter',
  'builtin://journal-background/summer',
  'builtin://journal-background/moonlit-lake',
  'builtin://journal-background/mountain-sunrise',
]);

describe('generate-stress-journal-data', () => {
  it('creates sparse journal entries from five years ago through three months ago', () => {
    const data = createStressData(parseArgs([
      '--today',
      '2026-08-31',
      '--seed',
      'test-seed',
      '--journals',
      '6',
      '--days-per-month',
      '4',
    ]));

    expect(data.range.startDate).toBe('2021-08-31');
    expect(data.range.endDate).toBe('2026-05-31');
    expect(data.counts.journals).toBe(6);
    expect(data.counts.activeDays).toBeLessThanOrEqual(data.range.months * 4);
    expect(data.counts.entries).toBeGreaterThanOrEqual(data.counts.activeDays * 2);
    expect(data.counts.entries).toBeLessThanOrEqual(data.counts.activeDays * 3 * 4);
    expect(data.storage.diaryEntries.version).toBe(CURRENT_DIARY_SCHEMA_VERSION);
    expect(data.storage.journals.version).toBe(1);
  });

  it('assigns every entry to a generated journal and built-in cover image', () => {
    const data = createStressData(parseArgs([
      '--today',
      '2026-08-31',
      '--seed',
      'cover-seed',
      '--journals',
      '4',
      '--days-per-month',
      '1',
    ]));
    const journalIds = new Set(data.storage.journals.journals.map((journal) => journal.id));

    expect(data.storage.journals.journals.every((journal) => journal.coverImageUri.startsWith('builtin://journal-background/'))).toBe(true);
    expect(data.storage.diaryEntries.entries.every((entry) => journalIds.has(entry.journalIds[0]))).toBe(true);
    expect(data.storage.diaryEntries.entries.every((entry) => entry.coverPhoto.uri.startsWith('builtin://journal-background/'))).toBe(true);
    expect(data.storage.diaryEntries.entries.every((entry) => entry.manualMood === entry.manualMoods[0])).toBe(true);
    expect(data.storage.journals.journals.every((journal) => CURRENT_COVER_URIS.has(journal.coverImageUri))).toBe(true);
    expect(data.storage.diaryEntries.entries.every((entry) => CURRENT_COVER_URIS.has(entry.coverPhoto.uri))).toBe(true);
    expect(data.storage.diaryEntries.entries.every((entry) => entry.viewCount >= 0)).toBe(true);
    expect(data.storage.diaryEntries.entries.every((entry) => entry.memoryReactions.length <= 1)).toBe(true);
  });
});
