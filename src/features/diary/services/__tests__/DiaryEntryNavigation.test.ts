import { getNextDiaryEntry, getPreviousDiaryEntry } from '@/features/diary/services/DiaryEntryNavigation';
import { buildDiaryEntry } from '@tests/fixtures/domain';

function createEntry(id: string) {
  return buildDiaryEntry({
    id,
    title: id,
  });
}

describe('getNextDiaryEntry', () => {
  it('returns the entry after the current entry in the provided order', () => {
    const first = createEntry('first');
    const second = createEntry('second');
    const third = createEntry('third');

    expect(getNextDiaryEntry([first, second, third], first.id)).toBe(second);
    expect(getNextDiaryEntry([first, second, third], second.id)).toBe(third);
  });

  it('wraps from the last entry to the first entry', () => {
    const first = createEntry('first');
    const second = createEntry('second');

    expect(getNextDiaryEntry([first, second], second.id)).toBe(first);
  });

  it('returns undefined for an unknown entry or a single-entry list', () => {
    const first = createEntry('first');
    const second = createEntry('second');

    expect(getNextDiaryEntry([first, second], 'missing')).toBeUndefined();
    expect(getNextDiaryEntry([first], first.id)).toBeUndefined();
  });
});

describe('getPreviousDiaryEntry', () => {
  it('returns the entry before the current entry in the provided order', () => {
    const first = createEntry('first');
    const second = createEntry('second');
    const third = createEntry('third');

    expect(getPreviousDiaryEntry([first, second, third], second.id)).toBe(first);
    expect(getPreviousDiaryEntry([first, second, third], third.id)).toBe(second);
  });

  it('wraps from the first entry to the last entry', () => {
    const first = createEntry('first');
    const second = createEntry('second');

    expect(getPreviousDiaryEntry([first, second], first.id)).toBe(second);
  });

  it('returns undefined for an unknown entry or a single-entry list', () => {
    const first = createEntry('first');
    const second = createEntry('second');

    expect(getPreviousDiaryEntry([first, second], 'missing')).toBeUndefined();
    expect(getPreviousDiaryEntry([first], first.id)).toBeUndefined();
  });
});
