import { fireEvent } from '@testing-library/react-native';

import { JournalHomeList, type JournalHomeItem } from '@/features/journal/components/JournalHomeList';
import { renderWithProviders } from '@tests/helpers';

const journal: JournalHomeItem = {
  id: 'journal-1',
  title: 'Everyday Notes',
  description: 'Small notes from normal days.',
  count: 2,
  canRename: true,
};

const baseProps = {
  items: [journal],
  totalItemCount: 1,
  columnCount: 1 as const,
  cardWidth: 320,
  openOptionsId: null,
  assigningCoverJournalId: null,
  deletingJournalId: null,
  contentBottomPadding: 88,
  onPressJournal: jest.fn(),
  onToggleOptions: jest.fn(),
  onEditJournal: jest.fn(),
  onDeleteJournal: jest.fn(),
  onSetCover: jest.fn(),
  onRemoveCover: jest.fn(),
  onCreateJournal: jest.fn(),
};

describe('JournalHomeList', () => {
  it('renders journal cover cards with count and description', async () => {
    const { getByText } = await renderWithProviders(
      <JournalHomeList {...baseProps} />,
      { wrapperOptions: { initialThemeMode: 'dark' } },
    );

    expect(getByText('Everyday Notes')).toBeTruthy();
    expect(getByText('Small notes from normal days.')).toBeTruthy();
    expect(getByText('2 entries')).toBeTruthy();
  });

  it('opens journal options through the supplied callback', async () => {
    const onToggleOptions = jest.fn();
    const { getByLabelText } = await renderWithProviders(
      <JournalHomeList {...baseProps} onToggleOptions={onToggleOptions} />,
      { wrapperOptions: { initialThemeMode: 'dark' } },
    );

    fireEvent.press(getByLabelText('Open journal options'));

    expect(onToggleOptions).toHaveBeenCalledWith('journal-1');
  });
});
