import { act, fireEvent } from '@testing-library/react-native';
import type React from 'react';
import { DiaryPaperBackgroundPickerModal } from '@/features/diary/components/DiaryPaperBackgroundPickerModal';
import { renderWithProviders } from '@tests/helpers';

jest.mock('@/features/subscription/hooks/useSubscription', () => ({
  useSubscription: () => ({ isPro: false }),
}));

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
  beforeEach(() => {
    jest.useRealTimers();
  });

  it('selects a diary paper background and dismisses the modal', async () => {
    const onSelect = jest.fn();
    const onDismiss = jest.fn();
    const { getByTestId } = await renderWithProviders(
      <DiaryPaperBackgroundPickerModal
        visible
        selectedPaperBackgroundId="vintage-parchment"
        onSelect={onSelect}
        onDismiss={onDismiss}
        onRequestPremium={jest.fn()}
      />,
      { wrapperOptions: { initialThemeMode: 'dark' } },
    );

    await fireEvent.press(getByTestId('entry-paper-background-soft-lined-paper'));

    expect(onSelect).toHaveBeenCalledWith('soft-lined-paper');
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('allows selecting a blank diary background', async () => {
    const onSelect = jest.fn();
    const onDismiss = jest.fn();
    const { getByTestId } = await renderWithProviders(
      <DiaryPaperBackgroundPickerModal
        visible
        selectedPaperBackgroundId="vintage-parchment"
        onSelect={onSelect}
        onDismiss={onDismiss}
        onRequestPremium={jest.fn()}
      />,
      { wrapperOptions: { initialThemeMode: 'dark' } },
    );

    await fireEvent.press(getByTestId('entry-paper-background-blank'));

    expect(onSelect).toHaveBeenCalledWith('blank');
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('requests premium instead of selecting locked premium paper', async () => {
    jest.useFakeTimers();
    const onSelect = jest.fn();
    const onDismiss = jest.fn();
    const onRequestPremium = jest.fn();
    const { getByTestId } = await renderWithProviders(
      <DiaryPaperBackgroundPickerModal
        visible
        selectedPaperBackgroundId="vintage-parchment"
        onSelect={onSelect}
        onDismiss={onDismiss}
        onRequestPremium={onRequestPremium}
      />,
      { wrapperOptions: { initialThemeMode: 'dark' } },
    );

    await fireEvent.press(getByTestId('entry-paper-background-pastel-memo-paper'));
    await act(async () => {
      jest.advanceTimersByTime(250);
    });

    expect(onSelect).not.toHaveBeenCalled();
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(onRequestPremium).toHaveBeenCalledTimes(1);
    jest.useRealTimers();
  });
});
