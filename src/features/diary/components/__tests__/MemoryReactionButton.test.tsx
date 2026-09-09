import {
  getClampedReactionTrayLeft,
  MemoryReactionButton,
} from '@/features/diary/components/MemoryReactionButton';
import { closeMemoryReactionPanels } from '@/features/diary/components/MemoryReactionPanelRegistry';
import { renderWithProviders } from '@tests/helpers';
import { act, fireEvent, waitFor } from '@testing-library/react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

function TwoReactionButtons(): React.JSX.Element {
  const [firstVisible, setFirstVisible] = useState(false);
  const [secondVisible, setSecondVisible] = useState(false);

  return (
    <View>
      <MemoryReactionButton
        reactions={[]}
        visible={firstVisible}
        onOpen={() => setFirstVisible(true)}
        onDismiss={() => setFirstVisible(false)}
        onToggleReaction={jest.fn()}
        testID="first-memory-reaction"
      />
      <MemoryReactionButton
        reactions={[]}
        visible={secondVisible}
        onOpen={() => setSecondVisible(true)}
        onDismiss={() => setSecondVisible(false)}
        onToggleReaction={jest.fn()}
        testID="second-memory-reaction"
      />
    </View>
  );
}

describe('MemoryReactionButton', () => {
  describe('getClampedReactionTrayLeft', () => {
    it('keeps a centered tray inside the left screen edge', () => {
      expect(
        getClampedReactionTrayLeft({
          alignment: 'center',
          anchorX: 24,
          anchorWidth: 112,
          screenWidth: 390,
          trayWidth: 310,
        }),
      ).toBe(-12);
    });

    it('keeps a centered tray inside the right screen edge', () => {
      expect(
        getClampedReactionTrayLeft({
          alignment: 'center',
          anchorX: 300,
          anchorWidth: 112,
          screenWidth: 390,
          trayWidth: 310,
        }),
      ).toBe(-232);
    });

    it('preserves the desired position when it already fits', () => {
      expect(
        getClampedReactionTrayLeft({
          alignment: 'center',
          anchorX: 160,
          anchorWidth: 112,
          screenWidth: 430,
          trayWidth: 300,
        }),
      ).toBe(-94);
    });
  });

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
    expect(getByTestId('memory-reaction-cherish-icon')).toBeTruthy();
    expect(getByTestId('memory-reaction-treasure-icon')).toBeTruthy();
    expect(getByTestId('memory-reaction-stormy-icon')).toBeTruthy();
  });

  it('shows only one selected reaction on the button', async () => {
    const { getByText, queryByText } = await renderWithProviders(
      <MemoryReactionButton
        reactions={['cherish', 'treasure']}
        visible={false}
        onOpen={jest.fn()}
        onDismiss={jest.fn()}
        onToggleReaction={jest.fn()}
        testID="memory-reaction"
      />,
      { wrapperOptions: { initialThemeMode: 'dark' } },
    );

    expect(getByText('Cherish')).toBeTruthy();
    expect(queryByText('+1')).toBeNull();
    expect(queryByText('Treasure')).toBeNull();
  });

  it('dismisses the previous reaction tray when another reaction button opens', async () => {
    const { getByTestId, queryByTestId } = await renderWithProviders(
      <TwoReactionButtons />,
      { wrapperOptions: { initialThemeMode: 'dark' } },
    );

    await fireEvent.press(getByTestId('first-memory-reaction'));
    expect(getByTestId('first-memory-reaction-tray')).toBeTruthy();

    await fireEvent.press(getByTestId('second-memory-reaction'));

    expect(queryByTestId('first-memory-reaction-tray')).toBeNull();
    expect(getByTestId('second-memory-reaction-tray')).toBeTruthy();
  });

  it('dismisses an open reaction tray when all panels are closed', async () => {
    const { getByTestId, queryByTestId } = await renderWithProviders(
      <TwoReactionButtons />,
      { wrapperOptions: { initialThemeMode: 'dark' } },
    );

    await fireEvent.press(getByTestId('first-memory-reaction'));
    expect(getByTestId('first-memory-reaction-tray')).toBeTruthy();

    await act(async () => {
      closeMemoryReactionPanels();
    });

    await waitFor(() => {
      expect(queryByTestId('first-memory-reaction-tray')).toBeNull();
    });
  });

  it('can align the reaction tray to the right edge without using an unclamped right offset', async () => {
    const { getByTestId } = await renderWithProviders(
      <MemoryReactionButton
        reactions={[]}
        visible
        onOpen={jest.fn()}
        onDismiss={jest.fn()}
        onToggleReaction={jest.fn()}
        trayAlignment="right"
        testID="memory-reaction"
      />,
      { wrapperOptions: { initialThemeMode: 'dark' } },
    );

    const trayStyle = StyleSheet.flatten(getByTestId('memory-reaction-tray').props.style);
    expect(typeof trayStyle.left).toBe('number');
    expect(trayStyle.left).toBeLessThan(0);
    expect(trayStyle.right).toBeUndefined();
  });

  it('can center the reaction tray over the button', async () => {
    const { getByTestId } = await renderWithProviders(
      <MemoryReactionButton
        reactions={[]}
        visible
        onOpen={jest.fn()}
        onDismiss={jest.fn()}
        onToggleReaction={jest.fn()}
        trayAlignment="center"
        testID="memory-reaction"
      />,
      { wrapperOptions: { initialThemeMode: 'dark' } },
    );

    const trayStyle = StyleSheet.flatten(getByTestId('memory-reaction-tray').props.style);
    expect(typeof trayStyle.left).toBe('number');
    expect(trayStyle.left).toBeLessThan(0);
  });
});
