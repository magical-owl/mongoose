import { buildDiaryEntry } from '@tests/fixtures/domain';

import { getDiaryEntryFilterOptions, sortDiaryEntriesByDateDesc } from '../DiaryEntryListQuery';

describe('DiaryEntryListQuery', () => {
  it('sorts diary entries by date descending without mutating the source list', () => {
    const olderEntry = buildDiaryEntry({
      id: '11111111-1111-4111-8111-111111111111',
      title: 'Older',
      date: '2025-12-31',
    });
    const newerEntry = buildDiaryEntry({
      id: '22222222-2222-4222-8222-222222222222',
      title: 'Newer',
      date: '2026-09-12',
    });
    const entries = [olderEntry, newerEntry];

    expect(sortDiaryEntriesByDateDesc(entries)).toEqual([newerEntry, olderEntry]);
    expect(entries).toEqual([olderEntry, newerEntry]);
  });

  it('builds unique sorted filter options for journal entries', () => {
    const entries = [
      buildDiaryEntry({
        id: '11111111-1111-4111-8111-111111111111',
        date: '2026-09-12',
        tags: ['weekend', 'family'],
        manualMoods: ['happy', 'calm'],
      }),
      buildDiaryEntry({
        id: '22222222-2222-4222-8222-222222222222',
        date: '2026-08-05',
        tags: ['family', 'work'],
        manualMoods: ['sad'],
      }),
      buildDiaryEntry({
        id: '33333333-3333-4333-8333-333333333333',
        date: '2025-12-31',
        tags: ['weekend'],
        manualMoods: ['neutral'],
      }),
    ];

    expect(getDiaryEntryFilterOptions(entries)).toEqual({
      year: ['2026', '2025'],
      month: ['2026-09', '2026-08', '2025-12'],
      date: ['2026-09-12', '2026-08-05', '2025-12-31'],
      tag: ['family', 'weekend', 'work'],
      mood: ['calm', 'happy', 'neutral', 'sad'],
    });
  });
});
