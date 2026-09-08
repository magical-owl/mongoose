import type { DiaryEntry } from '@/features/diary/domain/DiaryEntry';
import { replaceDiaryEntryPreservingOrder } from '@/features/diary/hooks/useDiary';
import { buildDiaryEntry } from '@tests/fixtures/domain';

const baseEntry = buildDiaryEntry({
  title: 'First',
  content: 'Entry',
  paperBackgroundId: 'vintage-parchment',
  createdAt: '2026-08-29T00:00:00.000Z',
  updatedAt: '2026-08-29T00:00:00.000Z',
});

describe('replaceDiaryEntryPreservingOrder', () => {
  it('updates an entry without moving it in same-day lists', () => {
    const first = baseEntry;
    const second = {
      ...baseEntry,
      id: '22222222-2222-4222-8222-222222222222',
      title: 'Second',
      createdAt: '2026-08-29T01:00:00.000Z',
      updatedAt: '2026-08-29T01:00:00.000Z',
    };
    const updatedSecond = {
      ...second,
      memoryReactions: ['treasure'],
      updatedAt: '2026-09-04T00:00:00.000Z',
    } satisfies DiaryEntry;

    const result = replaceDiaryEntryPreservingOrder([first, second], updatedSecond);

    expect(result.map((entry) => entry.id)).toEqual([first.id, second.id]);
    expect(result[1]).toBe(updatedSecond);
  });
});
