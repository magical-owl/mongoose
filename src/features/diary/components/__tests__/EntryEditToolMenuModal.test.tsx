import { act, fireEvent } from '@testing-library/react-native';
import type React from 'react';
import { EntryEditToolMenuModal } from '@/features/diary/components/EntryEditToolMenuModal';
import { renderWithProviders } from '@tests/helpers';

jest.mock('@shared/components/Modal', () => {
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');

  interface MockModalProps {
    readonly visible: boolean;
    readonly children: React.ReactNode;
    readonly accessibilityLabel?: string;
  }

  return {
    Modal: ({ visible, children, accessibilityLabel }: MockModalProps) => (
      visible ? <View accessibilityLabel={accessibilityLabel}>{children}</View> : null
    ),
  };
});

describe('EntryEditToolMenuModal', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('dismisses before routing the selected action', async () => {
    const onDismiss = jest.fn();
    const onPress = jest.fn();
    const { getByTestId } = await renderWithProviders(
      <EntryEditToolMenuModal
        visible
        title="Add"
        accessibilityLabel="Add tools"
        onDismiss={onDismiss}
        actions={[
          {
            id: 'photo',
            icon: 'image-plus',
            label: 'Photo sticker',
            description: 'Add a photo.',
            onPress,
            testID: 'photo-action',
          },
        ]}
      />,
      { wrapperOptions: { initialThemeMode: 'dark' } },
    );

    await fireEvent.press(getByTestId('photo-action'));

    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(onPress).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(220);
    });

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
