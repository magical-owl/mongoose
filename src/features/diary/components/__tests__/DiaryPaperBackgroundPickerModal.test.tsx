import { fireEvent } from '@testing-library/react-native';
import type React from 'react';
import { DiaryPaperBackgroundPickerModal } from '@/features/diary/components/DiaryPaperBackgroundPickerModal';
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

describe('DiaryPaperBackgroundPickerModal', () => {
  it('selects a diary paper background and dismisses the modal', async () => {
    const onSelect = jest.fn();
    const onDismiss = jest.fn();
    const { getByTestId } = await renderWithProviders(
      <DiaryPaperBackgroundPickerModal
        visible
        selectedPaperBackgroundId="vintage-parchment"
        onSelect={onSelect}
        onDismiss={onDismiss}
      />,
      { wrapperOptions: { initialThemeMode: 'dark' } },
    );

    fireEvent.press(getByTestId('entry-paper-background-soft-lined-paper'));

    expect(onSelect).toHaveBeenCalledWith('soft-lined-paper');
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
