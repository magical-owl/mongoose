import { DiaryTimelineList } from '@/features/diary/components/DiaryTimelineList';
import type { DiaryEntry } from '@/features/diary/domain/DiaryEntry';
import { renderWithProviders } from '@tests/helpers';
import { StyleSheet } from 'react-native';

function createEntry(id: string, title: string, date: string): DiaryEntry {
  return {
    id,
    title,
    content: '<p>A short entry.</p>',
    date,
    paperBackgroundId: 'vintage-parchment',
    stickers: [],
    companion: 'cat',
    isFavorite: false,
    tags: [],
    createdAt: `${date}T01:00:00.000Z`,
    updatedAt: `${date}T01:00:00.000Z`,
    manualMoodWeather: 'neutral',
    manualMood: 'neutral',
    manualMoods: ['neutral'],
    writingMode: 'free-write',
    isLockbox: false,
    sensory: {
      locationLabel: '',
      sounds: '',
      smells: '',
      energyLevel: 5,
      bodyState: '',
    },
    collectionIds: [],
    journalIds: [],
    photos: [],
    reflections: [],
  };
}

const firstEntry = createEntry('11111111-1111-4111-8111-111111111111', 'First', '2026-08-29');

describe('DiaryTimelineList', () => {
  it('lets visible date groups label card entries instead of repeating card date rails', async () => {
    const { queryByTestId, getByText } = await renderWithProviders(
      <DiaryTimelineList
        groupedEntries={[[firstEntry.date, [firstEntry]]]}
        mode="detailed"
        calendarDateFormat="month-day-year"
        entryHierarchyMode="date"
        onEntryPress={jest.fn()}
      />,
      { wrapperOptions: { initialThemeMode: 'dark' } },
    );

    expect(getByText(/Aug 29, 2026/)).toBeTruthy();
    expect(queryByTestId('entry-card-date-column')).toBeNull();
  });

  it('keeps feed entries aligned to the screen content width', async () => {
    const { getByTestId } = await renderWithProviders(
      <DiaryTimelineList
        groupedEntries={[[firstEntry.date, [firstEntry]]]}
        mode="feed"
        calendarDateFormat="month-day-year"
        entryHierarchyMode="date"
        onEntryPress={jest.fn()}
      />,
      { wrapperOptions: { initialThemeMode: 'dark' } },
    );

    const dateGroupStyle = StyleSheet.flatten(getByTestId('entry-feed-date-group').props.style);

    expect(dateGroupStyle.marginLeft).toBe(0);
  });
});
