import { fireEvent } from '@testing-library/react-native';

import { JournalEntryListChrome } from '@/features/diary/components/JournalEntryListChrome';
import { renderWithProviders } from '@tests/helpers';

const baseProps = {
  isDrawerOpen: true,
  drawerProfile: { displayName: 'Miming' },
  topInset: 0,
  bottomInset: 0,
  hasJournalCover: false,
  journalCoverImageSource: null,
  journalCoverHeight: 254,
  journalCoverOverlayOpacity: 1,
  journalTitle: 'Everyday Notes',
  entryCount: 2,
  selectableViewModes: ['timeline', 'detailed', 'feed'] as const,
  selectedViewModeIndex: 0,
  entryHierarchyMode: 'year-month-date' as const,
  expandedFilter: null,
  filterOptions: {
    year: ['2026'],
    month: ['2026-08'],
    date: ['2026-08-29'],
    tag: ['reflection'],
    mood: ['happy'],
  },
  search: '',
  filterYear: '',
  filterMonth: '',
  filterDate: '',
  filterTag: '',
  filterMood: '',
  favoritesOnly: false,
  moodColor: () => '#ffb15f',
  onCloseDrawer: jest.fn(),
  onOpenDrawer: jest.fn(),
  onProfilePress: jest.fn(),
  onNavigateBack: jest.fn(),
  onCreateEntry: jest.fn(),
  onNavigateSettings: jest.fn(),
  onSelectViewMode: jest.fn(),
  onChangeExpandedFilter: jest.fn(),
  onChangeSearch: jest.fn(),
  onChangeEntryHierarchyMode: jest.fn(),
  onChangeFilterYear: jest.fn(),
  onChangeFilterMonth: jest.fn(),
  onChangeFilterDate: jest.fn(),
  onChangeFilterTag: jest.fn(),
  onChangeFilterMood: jest.fn(),
  onToggleFavoritesOnly: jest.fn(),
  onClearFilters: jest.fn(),
};

describe('JournalEntryListChrome', () => {
  it('switches view modes through the header pill', async () => {
    const onSelectViewMode = jest.fn();
    const { getAllByLabelText } = await renderWithProviders(
      <JournalEntryListChrome {...baseProps} onSelectViewMode={onSelectViewMode} />,
      { wrapperOptions: { initialThemeMode: 'dark' } },
    );

    const feedControls = getAllByLabelText('Feed');
    expect(feedControls.length).toBeGreaterThan(0);
    await fireEvent.press(feedControls[0]!);

    expect(onSelectViewMode).toHaveBeenCalledWith(2, 'feed');
  });

  it('routes drawer actions through explicit callbacks', async () => {
    const onChangeExpandedFilter = jest.fn();
    const onClearFilters = jest.fn();
    const { getByLabelText, getByText } = await renderWithProviders(
      <JournalEntryListChrome
        {...baseProps}
        onChangeExpandedFilter={onChangeExpandedFilter}
        onClearFilters={onClearFilters}
      />,
      { wrapperOptions: { initialThemeMode: 'dark' } },
    );

    await fireEvent.press(getByLabelText('Filter by Year'));
    await fireEvent.press(getByLabelText('Filter by Month'));
    await fireEvent.press(getByLabelText('Filter by Date'));
    await fireEvent.press(getByText('Clear all filters'));

    expect(onChangeExpandedFilter).toHaveBeenCalledWith('year');
    expect(onChangeExpandedFilter).toHaveBeenCalledWith('month');
    expect(onChangeExpandedFilter).toHaveBeenCalledWith('date');
    expect(onClearFilters).toHaveBeenCalledTimes(1);
  });

  it('selects month filter options from the drawer', async () => {
    const onChangeFilterMonth = jest.fn();
    const { getByText } = await renderWithProviders(
      <JournalEntryListChrome
        {...baseProps}
        expandedFilter="month"
        onChangeFilterMonth={onChangeFilterMonth}
      />,
      { wrapperOptions: { initialThemeMode: 'dark' } },
    );

    await fireEvent.press(getByText('August 2026'));

    expect(onChangeFilterMonth).toHaveBeenCalledWith('2026-08');
  });
});
