import type React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { EntryViewHistoryModal } from '@/features/diary/components/EntryViewHistoryModal';
import { buildDiaryEntry } from '@tests/fixtures/domain';
import { renderWithProviders } from '@tests/helpers';

const safeAreaMetrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

function renderModal(entry: React.ComponentProps<typeof EntryViewHistoryModal>['entry']) {
  return renderWithProviders(
    <SafeAreaProvider initialMetrics={safeAreaMetrics}>
      <EntryViewHistoryModal visible entry={entry} onDismiss={jest.fn()} />
    </SafeAreaProvider>,
    { wrapperOptions: { initialThemeMode: 'dark' } },
  );
}

describe('EntryViewHistoryModal', () => {
  it('renders dated view history grouped by visit date', async () => {
    const entry = buildDiaryEntry({
      title: 'Quiet evening',
      viewCount: 4,
      viewHistory: [
        { viewedAt: '2026-09-08T10:15:00.000Z' },
        { viewedAt: '2026-09-08T11:20:00.000Z' },
        { viewedAt: '2026-09-07T07:20:00.000Z' },
      ],
    });
    const { getByText, getAllByTestId } = await renderModal(entry);

    expect(getByText('Quiet evening')).toBeTruthy();
    expect(getByText('4 total views')).toBeTruthy();
    expect(getByText('Sep 8, 2026')).toBeTruthy();
    expect(getByText('Sep 7, 2026')).toBeTruthy();
    expect(getByText('1 older view was counted before dated history was added.')).toBeTruthy();
    expect(getAllByTestId('entry-view-history-date-row')).toHaveLength(2);
  });

  it('explains when dated history has not started yet', async () => {
    const entry = buildDiaryEntry({ viewCount: 2, viewHistory: [] });
    const { getByText } = await renderModal(entry);

    expect(getByText('Dated view history starts with your next visit.')).toBeTruthy();
    expect(getByText('2 older views were counted before dated history was added.')).toBeTruthy();
  });
});
