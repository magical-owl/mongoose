import { fireEvent } from '@testing-library/react-native';
import { JournalSuggestionsFooter } from '@/features/journal/components/JournalSuggestionsFooter';
import type { Journal } from '@/features/journal/domain/Journal';
import { BUILTIN_JOURNAL_BACKGROUNDS } from '@/features/journal/domain/JournalBackgrounds';
import { renderWithProviders } from '@tests/helpers';

const journals: readonly Journal[] = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    title: 'Everyday Notes',
    description: '',
    color: '#4ECDC4',
    coverImageUri: BUILTIN_JOURNAL_BACKGROUNDS[0]?.uri,
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    title: 'Summer Trip',
    description: '',
    color: '#FFB86B',
    coverImageUri: BUILTIN_JOURNAL_BACKGROUNDS[1]?.uri,
    createdAt: '2026-08-02T00:00:00.000Z',
    updatedAt: '2026-08-02T00:00:00.000Z',
  },
];

describe('JournalSuggestionsFooter', () => {
  it('renders a horizontal suggestion list excluding the current journal', async () => {
    const onPressJournal = jest.fn();
    const onPressTitle = jest.fn();
    const { getByTestId, getByText, queryByText } = await renderWithProviders(
      <JournalSuggestionsFooter
        journals={journals}
        currentJournalId="11111111-1111-4111-8111-111111111111"
        entryCountsByJournalId={new Map([['22222222-2222-4222-8222-222222222222', 3]])}
        onPressJournal={onPressJournal}
        onPressTitle={onPressTitle}
      />,
    );

    expect(getByTestId('journal-suggestions-footer')).toBeTruthy();
    expect(getByText('More from your journals')).toBeTruthy();
    expect(queryByText('Everyday Notes')).toBeNull();
    expect(getByText('Summer Trip')).toBeTruthy();
    expect(getByText('3 entries')).toBeTruthy();

    fireEvent.press(getByText('Summer Trip'));

    expect(onPressJournal).toHaveBeenCalledWith(journals[1]);

    fireEvent.press(getByText('More from your journals'));

    expect(onPressTitle).toHaveBeenCalledTimes(1);
  });

  it('does not render when no other journals are available', async () => {
    const { queryByTestId } = await renderWithProviders(
      <JournalSuggestionsFooter
        journals={journals.slice(0, 1)}
        currentJournalId="11111111-1111-4111-8111-111111111111"
        entryCountsByJournalId={new Map()}
        onPressJournal={jest.fn()}
      />,
    );

    expect(queryByTestId('journal-suggestions-footer')).toBeNull();
  });
});
