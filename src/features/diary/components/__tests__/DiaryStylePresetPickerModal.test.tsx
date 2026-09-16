import { act, fireEvent } from '@testing-library/react-native';
import type React from 'react';
import { DiaryStylePresetPickerModal } from '@/features/diary/components/DiaryStylePresetPickerModal';
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

describe('DiaryStylePresetPickerModal', () => {
  it('selects a style preset without dismissing the modal', async () => {
    const onSelect = jest.fn();
    const onDismiss = jest.fn();
    const { getByTestId } = await renderWithProviders(
      <DiaryStylePresetPickerModal
        visible
        selectedPresetId="classic"
        onSelect={onSelect}
        onDismiss={onDismiss}
        onRequestPremium={jest.fn()}
      />,
      { wrapperOptions: { initialThemeMode: 'dark' } },
    );

    await fireEvent.press(getByTestId('entry-style-preset-kraft'));

    expect(onSelect).toHaveBeenCalledWith('kraft');
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it('falls back to the default selected preset for unknown persisted values', async () => {
    const { getByTestId } = await renderWithProviders(
      <DiaryStylePresetPickerModal
        visible
        selectedPresetId="missing"
        onSelect={jest.fn()}
        onDismiss={jest.fn()}
        onRequestPremium={jest.fn()}
      />,
      { wrapperOptions: { initialThemeMode: 'dark' } },
    );

    expect(getByTestId('entry-style-preset-classic')).toHaveProp('accessibilityState', expect.objectContaining({ selected: true }));
  });

  it('requests premium instead of selecting locked premium presets', async () => {
    jest.useFakeTimers();
    const onSelect = jest.fn();
    const onDismiss = jest.fn();
    const onRequestPremium = jest.fn();
    const { getByTestId } = await renderWithProviders(
      <DiaryStylePresetPickerModal
        visible
        selectedPresetId="classic"
        onSelect={onSelect}
        onDismiss={onDismiss}
        onRequestPremium={onRequestPremium}
      />,
      { wrapperOptions: { initialThemeMode: 'dark' } },
    );

    await fireEvent.press(getByTestId('entry-style-preset-pressed-petal'));
    act(() => {
      jest.advanceTimersByTime(250);
    });

    expect(onSelect).not.toHaveBeenCalled();
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(onRequestPremium).toHaveBeenCalledTimes(1);
    jest.useRealTimers();
  });
});
