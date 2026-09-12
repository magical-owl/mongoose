import { buildDiaryEntry } from '@tests/fixtures/domain';

import { filterVisibleDiaryEntries } from '../DiaryEntryListFilter';
import { clearDiaryEntryPreviewTextCache, getDiaryEntryPreviewText } from '../DiaryEntryPreviewText';

const emptyFilters = {
  search: '',
  year: '',
  month: '',
  date: '',
  tag: '',
  mood: '',
  favoritesOnly: false,
};

describe('DiaryEntryListFilter', () => {
  afterEach(() => {
    clearDiaryEntryPreviewTextCache();
  });

  it('returns only visible entries by default', () => {
    const visibleEntry = buildDiaryEntry({
      id: '11111111-1111-4111-8111-111111111111',
      title: 'Visible',
      isLockbox: false,
    });
    const hiddenEntry = buildDiaryEntry({
      id: '22222222-2222-4222-8222-222222222222',
      title: 'Hidden',
      expiresAt: '2026-01-01T00:00:00.000Z',
    });

    expect(filterVisibleDiaryEntries([visibleEntry, hiddenEntry], emptyFilters)).toEqual([visibleEntry]);
  });

  it('matches title, body preview, date, tag, mood, and favorite filters', () => {
    const matchingEntry = buildDiaryEntry({
      id: '11111111-1111-4111-8111-111111111111',
      title: 'Quiet morning',
      content: '<p>Watched the clouds move slowly.</p>',
      date: '2026-09-12',
      tags: ['weekend'],
      manualMoods: ['calm'],
      isFavorite: true,
    });
    const otherEntry = buildDiaryEntry({
      id: '22222222-2222-4222-8222-222222222222',
      title: 'Work notes',
      content: '<p>Finished a report.</p>',
      date: '2025-09-12',
      tags: ['office'],
      manualMoods: ['tired'],
      isFavorite: true,
    });

    expect(filterVisibleDiaryEntries([matchingEntry, otherEntry], {
      ...emptyFilters,
      search: 'clouds',
      year: '2026',
      month: '2026-09',
      date: '2026-09-12',
      tag: 'week',
      mood: 'calm',
      favoritesOnly: true,
    })).toEqual([matchingEntry]);
  });

  it('preserves the input order of matching entries', () => {
    const firstEntry = buildDiaryEntry({
      id: '11111111-1111-4111-8111-111111111111',
      title: 'First match',
      tags: ['shared'],
    });
    const secondEntry = buildDiaryEntry({
      id: '22222222-2222-4222-8222-222222222222',
      title: 'Second match',
      tags: ['shared'],
    });

    expect(filterVisibleDiaryEntries([firstEntry, secondEntry], {
      ...emptyFilters,
      tag: 'shared',
    })).toEqual([firstEntry, secondEntry]);
  });

  it('uses the updated body preview when edited content changes', () => {
    const entry = buildDiaryEntry({
      id: '11111111-1111-4111-8111-111111111111',
      title: 'Draft',
      content: '<p>Old body.</p>',
      updatedAt: '2026-09-12T01:00:00.000Z',
    });

    expect(getDiaryEntryPreviewText(entry)).toBe('Old body.');
    expect(filterVisibleDiaryEntries([{ ...entry, content: '<p>Fresh body.</p>' }], {
      ...emptyFilters,
      search: 'fresh',
    })).toHaveLength(1);
  });
});
