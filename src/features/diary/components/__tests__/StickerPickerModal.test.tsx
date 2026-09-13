import { act, fireEvent } from '@testing-library/react-native';
import type React from 'react';
import { StickerPickerModal } from '@/features/diary/components/StickerPickerModal';
import { renderWithProviders } from '@tests/helpers';

jest.mock('@/features/subscription/hooks/useSubscription', () => ({
  useSubscription: () => ({ isPro: false }),
}));

jest.mock('@shared/components/Modal', () => {
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');

  interface MockModalProps {
    readonly visible: boolean;
    readonly children: React.ReactNode;
  }

  return {
    Modal: ({ visible, children }: MockModalProps) => (visible ? <View>{children}</View> : null),
  };
});

describe('StickerPickerModal premium gates', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('allows browsing a locked premium category without opening premium', async () => {
    const onClose = jest.fn();
    const onSelectSticker = jest.fn();
    const onRequestPremium = jest.fn();
    const { getByText } = await renderWithProviders(
      <StickerPickerModal
        visible
        onClose={onClose}
        onSelectSticker={onSelectSticker}
        onRequestPremium={onRequestPremium}
      />,
      { wrapperOptions: { initialThemeMode: 'dark' } },
    );

    await fireEvent.press(getByText('Winter'));

    expect(onSelectSticker).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    expect(onRequestPremium).not.toHaveBeenCalled();
    expect(getByText('Snowflake')).toBeTruthy();
  });

  it('opens premium when a locked premium sticker from a browsed category is tapped', async () => {
    const onClose = jest.fn();
    const onSelectSticker = jest.fn();
    const onRequestPremium = jest.fn();
    const { getByText } = await renderWithProviders(
      <StickerPickerModal
        visible
        onClose={onClose}
        onSelectSticker={onSelectSticker}
        onRequestPremium={onRequestPremium}
      />,
      { wrapperOptions: { initialThemeMode: 'dark' } },
    );

    await fireEvent.press(getByText('Winter'));
    await fireEvent.press(getByText('Snowflake'));
    await act(async () => {
      jest.advanceTimersByTime(250);
    });

    expect(onSelectSticker).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onRequestPremium).toHaveBeenCalledTimes(1);
  });

  it('opens premium when a locked premium sticker search result is tapped', async () => {
    const onClose = jest.fn();
    const onSelectSticker = jest.fn();
    const onRequestPremium = jest.fn();
    const { getByPlaceholderText, getByText } = await renderWithProviders(
      <StickerPickerModal
        visible
        onClose={onClose}
        onSelectSticker={onSelectSticker}
        onRequestPremium={onRequestPremium}
      />,
      { wrapperOptions: { initialThemeMode: 'dark' } },
    );

    await act(async () => {
      await fireEvent.changeText(getByPlaceholderText('Search stickers...'), 'snowflake');
    });
    await fireEvent.press(getByText('Snowflake'));
    await act(async () => {
      jest.advanceTimersByTime(250);
    });

    expect(onSelectSticker).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onRequestPremium).toHaveBeenCalledTimes(1);
  });
});
