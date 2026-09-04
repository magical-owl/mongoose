import { fireEvent } from '@testing-library/react-native';

import { VirtualizedDiaryEntryList } from '@/features/diary/components/VirtualizedDiaryEntryList';
import type { DiaryEntry } from '@/features/diary/domain/DiaryEntry';
import { renderWithProviders } from '@tests/helpers';

function createEntry(id: string, title: string, date: string): DiaryEntry {
  return {
    id,
    title,
    content: '<p>A short entry.</p>',
    date,
    paperBackgroundId: 'vintage-parchment',
    bodyFontFamily: 'system',
    stickers: [],
    companion: 'cat',
    isFavorite: false,
    memoryReactions: [],
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

const baseProps = {
  totalEntryCount: 1,
  mode: 'timeline' as const,
  entryHierarchyMode: 'year-month-date' as const,
  calendarDateFormat: 'month-day-year' as const,
  collapsedYears: new Set<string>(),
  collapsedMonths: new Set<string>(),
  collapsedDates: new Set<string>(),
  hasMoreEntries: false,
  journals: [],
  currentJournalId: 'journal-1',
  entryCountsByJournalId: new Map<string, number>(),
  searchQuery: '',
  onScroll: jest.fn(),
  onToggleYear: jest.fn(),
  onToggleMonth: jest.fn(),
  onToggleDate: jest.fn(),
  onEntryPress: jest.fn(),
  onPressJournalSuggestion: jest.fn(),
  onPressSuggestionsTitle: jest.fn(),
};

describe('VirtualizedDiaryEntryList', () => {
  it('renders hierarchy rows and entry rows from entries', async () => {
    const entry = createEntry('11111111-1111-4111-8111-111111111111', 'First', '2026-08-29');
    const onToggleYear = jest.fn();

    const { getByText } = await renderWithProviders(
      <VirtualizedDiaryEntryList
        {...baseProps}
        entries={[entry]}
        onToggleYear={onToggleYear}
      />,
      { wrapperOptions: { initialThemeMode: 'dark' } },
    );

    fireEvent.press(getByText('2026'));

    expect(getByText('August')).toBeTruthy();
    expect(getByText('Aug 29, 2026')).toBeTruthy();
    expect(getByText('First')).toBeTruthy();
    expect(onToggleYear).toHaveBeenCalledWith('2026');
  });

  it('renders the search empty state when no entries match', async () => {
    const { getByText } = await renderWithProviders(
      <VirtualizedDiaryEntryList
        {...baseProps}
        entries={[]}
        totalEntryCount={0}
        searchQuery="missing"
      />,
      { wrapperOptions: { initialThemeMode: 'dark' } },
    );

    expect(getByText('No matching entries.')).toBeTruthy();
  });

  it('passes memory reaction controls through in card and feed views', async () => {
    const entry = createEntry('11111111-1111-4111-8111-111111111111', 'First', '2026-08-29');
    const onToggleMemoryReaction = jest.fn().mockResolvedValue(true);

    const cardView = await renderWithProviders(
      <VirtualizedDiaryEntryList
        {...baseProps}
        entries={[entry]}
        mode="detailed"
        entryHierarchyMode="none"
        onToggleMemoryReaction={onToggleMemoryReaction}
      />,
      { wrapperOptions: { initialThemeMode: 'dark' } },
    );

    expect(cardView.getByTestId('entry-card-memory-reaction')).toBeTruthy();
    cardView.unmount();

    const feedView = await renderWithProviders(
      <VirtualizedDiaryEntryList
        {...baseProps}
        entries={[entry]}
        mode="feed"
        entryHierarchyMode="none"
        onToggleMemoryReaction={onToggleMemoryReaction}
      />,
      { wrapperOptions: { initialThemeMode: 'dark' } },
    );

    expect(feedView.getByTestId('entry-feed-memory-reaction')).toBeTruthy();
  });
});
