import { MemoryReactionButton } from '@/features/diary/components/MemoryReactionButton';
import { renderWithProviders } from '@tests/helpers';

describe('MemoryReactionButton', () => {
  it('renders an anchored reaction tray when visible', async () => {
    const { getByTestId, getByText } = await renderWithProviders(
      <MemoryReactionButton
        reactions={['cherish']}
        visible
        onOpen={jest.fn()}
        onDismiss={jest.fn()}
        onToggleReaction={jest.fn()}
        testID="memory-reaction"
      />,
      { wrapperOptions: { initialThemeMode: 'dark' } },
    );

    expect(getByText('Cherish')).toBeTruthy();
    expect(getByTestId('memory-reaction-tray')).toBeTruthy();
    expect(getByTestId('memory-reaction-cherish')).toBeTruthy();
    expect(getByTestId('memory-reaction-treasure')).toBeTruthy();
    expect(getByTestId('memory-reaction-smile')).toBeTruthy();
    expect(getByTestId('memory-reaction-heavy')).toBeTruthy();
    expect(getByTestId('memory-reaction-tender')).toBeTruthy();
    expect(getByTestId('memory-reaction-stormy')).toBeTruthy();
    expect(getByTestId('memory-reaction-wonder')).toBeTruthy();
  });
});
