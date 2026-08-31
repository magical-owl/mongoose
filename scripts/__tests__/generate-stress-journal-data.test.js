const { createStressData, parseArgs } = require('../generate-stress-journal-data');

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
    expect(data.storage.diaryEntries.version).toBe(5);
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
  });
});
