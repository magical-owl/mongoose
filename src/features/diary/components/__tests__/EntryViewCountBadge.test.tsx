import { StyleSheet } from 'react-native';
import { EntryViewCountBadge } from '@/features/diary/components/EntryViewCountBadge';
import { renderWithProviders } from '@tests/helpers';

describe('EntryViewCountBadge', () => {
  it('renders the view count accessibly', async () => {
    const { getByLabelText, getByText } = await renderWithProviders(
      <EntryViewCountBadge count={7} accessibilityLabel="Viewed 7 times." />,
    );

    expect(getByText('7')).toBeTruthy();
    expect(getByLabelText('Viewed 7 times.')).toBeTruthy();
  });

  it('supports footer sizing', async () => {
    const { getByLabelText } = await renderWithProviders(
      <EntryViewCountBadge
        count={12}
        accessibilityLabel="Viewed 12 times."
        iconSize={20}
        height={40}
        minWidth={64}
      />,
    );

    const style = StyleSheet.flatten(getByLabelText('Viewed 12 times.').props.style);

    expect(style.height).toBe(40);
    expect(style.minWidth).toBe(64);
    expect(style.borderRadius).toBe(20);
  });
});
