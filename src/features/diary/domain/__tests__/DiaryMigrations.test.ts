import { CURRENT_DIARY_SCHEMA_VERSION, migrateDiaryStorage } from '../DiaryMigrations';

const entry = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  title: 'Legacy',
  content: 'A saved entry',
  date: '2026-08-13',
  paperBackgroundId: 'vintage-parchment',
  stickers: [],
  companion: 'cat',
  isFavorite: false,
  tags: [],
  createdAt: '2026-08-13T00:00:00.000Z',
  updatedAt: '2026-08-13T00:00:00.000Z',
};

describe('Diary migrations', () => {
  it('migrates the pre-versioned array format', () => {
    const result = migrateDiaryStorage([entry]);
    expect(result.version).toBe(CURRENT_DIARY_SCHEMA_VERSION);
    expect(result.entries).toHaveLength(1);
  });

  it('accepts versioned envelopes and drops invalid records', () => {
    const result = migrateDiaryStorage({ version: 1, entries: [entry, { invalid: true }] });
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0]?.title).toBe('Legacy');
  });

  it('defaults reflections for legacy entries', () => {
    const result = migrateDiaryStorage([entry]);
    expect(result.entries[0]?.reflections).toEqual([]);
  });
});
